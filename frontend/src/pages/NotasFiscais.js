import React, { useState, useEffect } from 'react';
// 1. Trocamos axios por api customizada
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FilePlus, CheckCircle, Search, CalendarDays, ReceiptText, Factory, Lock } from 'lucide-react';
import { toast } from 'sonner';

const NotasFiscais = () => {
  const { isAdmin } = useAuth();
  
  const [notas, setNotas] = useState([]);
  const [vencimentos, setVencimentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    numero_nf: '',
    pedido_id: '',
    valor_total: '',
    numero_parcelas: '1',
    data_p1: '',
    data_p2: '',
    data_p3: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // 2. Chamadas protegidas com Token automático
      const [notasRes, vencimentosRes, pedidosRes] = await Promise.all([
        api.get('/notas-fiscais'),
        api.get('/vencimentos'),
        api.get('/pedidos')
      ]);
      setNotas(notasRes.data);
      setVencimentos(vencimentosRes.data);
      setPedidos(pedidosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Acesso negado: Apenas administradores podem lançar NFs');
      return;
    }

    try {
      const payload = {
        ...formData,
        valor_total: parseFloat(formData.valor_total),
        numero_parcelas: parseInt(formData.numero_parcelas),
        datas_manuais: [formData.data_p1, formData.data_p2, formData.data_p3].filter(d => d !== '')
      };
      // 3. POST centralizado
      await api.post('/notas-fiscais', payload);
      toast.success('Nota fiscal e parcelas criadas!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar nota fiscal');
    }
  };

  const handleMarcarPago = async (vencimentoId) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem confirmar pagamentos');
      return;
    }

    try {
      const hoje = new Date().toISOString();
      // 4. PUT centralizado para baixa de pagamento
      await api.put(`/vencimentos/${vencimentoId}`, { 
        status: 'Pago',
        data_pagamento: hoje 
      });
      toast.success('Pagamento confirmado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({
      numero_nf: '', pedido_id: '', valor_total: '',
      numero_parcelas: '1', data_p1: '', data_p2: '', data_p3: ''
    });
  };

  const getPedidoInfo = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    return pedido ? { oc: pedido.numero_oc, fabrica: pedido.numero_pedido_fabrica } : { oc: 'N/A', fabrica: '---' };
  };

  // Estilo padrão SAP (Industrial)
  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-10 outline-none transition-all";
  const sapSelectTrigger = "bg-white border-slate-300 focus:ring-0 rounded-none h-10 outline-none w-full flex items-center justify-between px-3 transition-all";

  const vencimentosFiltrados = vencimentos.filter(venc => {
    const nota = notas.find(n => n.id === venc.nota_fiscal_id);
    const info = getPedidoInfo(nota?.pedido_id);
    const term = searchTerm.toLowerCase();
    return (
      nota?.numero_nf.toLowerCase().includes(term) || 
      (info.fabrica && info.fabrica.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Financeiro / NFs {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Faturamento e comissões</p>
        </div>

        {isAdmin && (
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="w-full md:w-auto bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-8 font-bold text-[10px] uppercase tracking-widest border-b-2 border-[#051C36] py-6 shadow-md transition-all"
          >
            <FilePlus size={16} className="mr-2" /> Nova Nota Fiscal
          </Button>
        )}
      </div>

      {/* BARRA DE PESQUISA */}
      <Card className="mb-6 p-1 bg-white border border-slate-300 flex items-center shadow-inner rounded-none">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input
          placeholder="Buscar NF ou Fábrica..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none focus:ring-0 text-slate-700 text-sm italic bg-transparent h-12 w-full outline-none"
        />
      </Card>

      {/* TABELA DE VENCIMENTOS */}
      <Card className="bg-white border border-slate-300 rounded-none shadow-xl overflow-hidden mb-8">
        <div className="p-4 bg-[#0A3D73] text-white flex items-center justify-between">
          <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <CalendarDays size={16} /> Próximos Vencimentos
          </h3>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#0A3D73] text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">NF</th>
                <th className="px-6 py-4">Fábrica</th>
                <th className="px-6 py-4 text-center">Parcela</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right text-blue-700">Comissão</th>
                <th className="px-6 py-4 text-center">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ação</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {vencimentosFiltrados.map(venc => {
                const nota = notas.find(n => n.id === venc.nota_fiscal_id);
                const info = getPedidoInfo(nota?.pedido_id);
                return (
                  <tr key={venc.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">{nota?.numero_nf}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{info.fabrica}</td>
                    <td className="px-6 py-4 text-center text-xs">{venc.parcela}ª</td>
                    <td className="px-6 py-4 font-bold text-xs">{new Date(venc.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">R$ {venc.valor.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-green-700 text-xs italic">R$ {venc.comissao_calculada.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-[9px] font-black border uppercase ${
                        venc.status === 'Pago' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {venc.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {venc.status !== 'Pago' && (
                          <Button size="sm" onClick={() => handleMarcarPago(venc.id)} className="h-7 bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none text-[10px] font-bold uppercase">
                            Baixar
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VERSÃO MOBILE */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {vencimentosFiltrados.map(venc => {
            const nota = notas.find(n => n.id === venc.nota_fiscal_id);
            const info = getPedidoInfo(nota?.pedido_id);
            return (
              <div key={venc.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nota Fiscal</span>
                    <span className="font-mono font-bold text-slate-900">NF {nota?.numero_nf || '---'}</span>
                  </div>
                  <span className={`px-3 py-1 text-[9px] font-black border uppercase ${
                    venc.status === 'Pago' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {venc.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Factory size={10}/> Fábrica</span>
                      <span className="text-[10px] font-mono font-bold text-slate-700 truncate">{info.fabrica}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Vencimento</span>
                      <span className="text-[10px] font-bold text-blue-900">{new Date(venc.data_vencimento).toLocaleDateString('pt-BR')}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Sua Comissão</span>
                      <span className="text-sm font-mono font-bold text-green-700 italic">R$ {venc.comissao_calculada.toFixed(2)}</span>
                   </div>
                   {isAdmin && venc.status !== 'Pago' && (
                     <Button 
                        onClick={() => handleMarcarPago(venc.id)} 
                        className="bg-[#0A3D73] text-white rounded-none text-[10px] font-bold h-10 px-6 uppercase"
                     >
                        Confirmar Baixa
                     </Button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* MODAL DE CADASTRO (ADMIN) */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-full md:max-w-md bg-white border-none shadow-2xl rounded-none p-0 overflow-y-auto max-h-screen">
            <DialogHeader className="p-6 bg-[#0A3D73] sticky top-0 z-10">
              <DialogTitle className="text-white text-xs font-bold flex items-center gap-3 uppercase tracking-widest">
                <ReceiptText size={18} /> Lançar Nota Fiscal
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#0A3D73] font-bold text-[9px] uppercase">Número da NF</Label>
                  <Input value={formData.numero_nf} onChange={(e) => setFormData({...formData, numero_nf: e.target.value})} placeholder="000.000" required className={sapInput} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#0A3D73] font-bold text-[9px] uppercase">Nº Parcelas</Label>
                  <Select value={formData.numero_parcelas} onValueChange={(v) => setFormData({...formData, numero_parcelas: v})}>
                    <SelectTrigger className={sapSelectTrigger}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white rounded-none border-slate-300">
                      <SelectItem value="1" className="text-xs cursor-pointer">1 parcela</SelectItem>
                      <SelectItem value="2" className="text-xs cursor-pointer">2 parcelas</SelectItem>
                      <SelectItem value="3" className="text-xs cursor-pointer">3 parcelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0A3D73] font-bold text-[9px] uppercase">Pedido / Fábrica</Label>
                <Select value={formData.pedido_id} onValueChange={(v) => setFormData({...formData, pedido_id: v})}>
                  <SelectTrigger className={sapSelectTrigger}><SelectValue placeholder="Selecione o pedido" /></SelectTrigger>
                  <SelectContent className="bg-white rounded-none border-slate-300 max-h-60 overflow-y-auto">
                    {pedidos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()} className="text-[10px] uppercase font-bold cursor-pointer">
                        {p.numero_pedido_fabrica} - {p.cliente?.razao_social || p.cliente_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#0A3D73] font-bold text-[9px] uppercase">Valor Total da Nota</Label>
                <Input type="number" step="0.01" value={formData.valor_total} onChange={(e) => setFormData({...formData, valor_total: e.target.value})} placeholder="R$ 0,00" required className={sapInput} />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Datas de Vencimento</p>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-[8px] font-bold uppercase text-slate-400">Vencimento P1</Label>
                    <Input type="date" value={formData.data_p1} onChange={(e) => setFormData({...formData, data_p1: e.target.value})} required className={sapInput} />
                  </div>
                  {formData.numero_parcelas >= "2" && (
                    <div>
                      <Label className="text-[8px] font-bold uppercase text-slate-400">Vencimento P2</Label>
                      <Input type="date" value={formData.data_p2} onChange={(e) => setFormData({...formData, data_p2: e.target.value})} required className={sapInput} />
                    </div>
                  )}
                  {formData.numero_parcelas >= "3" && (
                    <div>
                      <Label className="text-[8px] font-bold uppercase text-slate-400">Vencimento P3</Label>
                      <Input type="date" value={formData.data_p3} onChange={(e) => setFormData({...formData, data_p3: e.target.value})} required className={sapInput} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" className="w-full bg-[#0A3D73] text-white rounded-none text-[10px] font-bold uppercase py-6">
                  Salvar Nota Fiscal
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full rounded-none text-[10px] font-bold uppercase py-6">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NotasFiscais;