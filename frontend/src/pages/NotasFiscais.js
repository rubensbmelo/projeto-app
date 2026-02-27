import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FilePlus, Search, CalendarDays, ReceiptText, Factory, Lock, CheckCircle2, DollarSign } from 'lucide-react';
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
      const [notasRes, vencimentosRes, pedidosRes] = await Promise.all([
        api.get('/notas-fiscais'),
        api.get('/vencimentos'),
        api.get('/pedidos')
      ]);
      setNotas(notasRes.data || []);
      setVencimentos(vencimentosRes.data || []);
      setPedidos(pedidosRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
    } finally { setLoading(false); }
  };

  const formatarBR = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  const limparParaNumero = (v) => {
    if (!v) return 0;
    return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Acesso negado');

    try {
      const payload = {
        ...formData,
        valor_total: limparParaNumero(formData.valor_total),
        numero_parcelas: parseInt(formData.numero_parcelas),
        datas_manuais: [formData.data_p1, formData.data_p2, formData.data_p3].filter(d => d !== '')
      };

      await api.post('/notas-fiscais', payload);
      
      // LOGICA IMPORTANTE: Atualizar o status do pedido para FATURADO
      if (formData.pedido_id) {
        await api.put(`/pedidos/${formData.pedido_id}`, { status: 'FATURADO' });
      }

      toast.success('NF lançada e Pedido atualizado!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar nota fiscal');
    }
  };

  const handleMarcarPago = async (vencimentoId) => {
    if (!isAdmin) return;
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await api.put(`/vencimentos/${vencimentoId}`, { status: 'Pago', data_pagamento: hoje });
      toast.success('Pagamento confirmado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({ numero_nf: '', pedido_id: '', valor_total: '', numero_parcelas: '1', data_p1: '', data_p2: '', data_p3: '' });
  };

  const getPedidoInfo = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    return pedido ? { 
      fabrica: pedido.numero_fabrica || pedido.numero_pedido_fabrica, 
      cliente: pedido.cliente_nome,
      item: pedido.item_nome 
    } : { fabrica: '---', cliente: 'N/A', item: 'N/A' };
  };

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-10 outline-none transition-all";
  const sapSelectTrigger = "bg-white border-slate-300 focus:ring-0 rounded-none h-10 outline-none w-full flex items-center justify-between px-3 transition-all";

  const vencimentosFiltrados = vencimentos.filter(venc => {
    const nota = notas.find(n => n.id === venc.nota_fiscal_id);
    const info = getPedidoInfo(nota?.pedido_id);
    const term = searchTerm.toLowerCase();
    return (
      nota?.numero_nf.toLowerCase().includes(term) || 
      (info.fabrica && String(info.fabrica).toLowerCase().includes(term)) ||
      (info.cliente && info.cliente.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      {/* CABEÇALHO FINANCEIRO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Controle Financeiro {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de NFs e Recebimento de Comissões</p>
        </div>

        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="w-full md:w-auto bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase py-6 shadow-md transition-all">
            <FilePlus size={16} className="mr-2" /> Lançar Faturamento (NF)
          </Button>
        )}
      </div>

      {/* BUSCA */}
      <Card className="mb-6 p-1 bg-white border border-slate-300 flex items-center shadow-sm rounded-none">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input
          placeholder="Buscar por NF, Cliente ou Nº Fábrica..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none focus:ring-0 text-sm italic bg-transparent h-12 w-full outline-none"
        />
      </Card>

      {/* TABELA DE VENCIMENTOS */}
      <Card className="bg-white border border-slate-300 rounded-none shadow-xl overflow-hidden">
        <div className="p-4 bg-[#0A3D73] text-white">
          <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <CalendarDays size={16} /> Fluxo de Comissões a Receber
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#0A3D73] text-[10px] font-bold uppercase">
              <tr>
                <th className="px-6 py-4">NF / Fábrica</th>
                <th className="px-6 py-4">Cliente / Item</th>
                <th className="px-6 py-4 text-center">Parcela</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right text-blue-700">Comissão (R$)</th>
                <th className="px-6 py-4 text-center">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ação</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {vencimentosFiltrados.map(venc => {
                const nota = notas.find(n => n.id === venc.nota_fiscal_id);
                const info = getPedidoInfo(nota?.pedido_id);
                const isPago = venc.status === 'Pago';

                return (
                  <tr key={venc.id} className={`hover:bg-blue-50/50 transition-colors ${isPago ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">NF {nota?.numero_nf}</div>
                      <div className="text-[9px] text-amber-600 font-bold uppercase">Ref: {info.fabrica}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs uppercase">{info.cliente?.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400 italic">{info.item}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{venc.parcela}ª</td>
                    <td className="px-6 py-4 font-bold text-xs text-blue-900">
                      {new Date(venc.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-700 text-xs">
                      R$ {formatarBR(venc.comissao_calculada)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-[9px] font-black border uppercase ${
                        isPago ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {venc.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {!isPago && (
                          <Button size="sm" onClick={() => handleMarcarPago(venc.id)} className="bg-[#0A3D73] text-white rounded-none text-[9px] font-bold uppercase h-8">
                            Confirmar Pagto
                          </Button>
                        )}
                        {isPago && <CheckCircle2 size={18} className="text-green-500 ml-auto" />}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DIALOG LANÇAMENTO NF */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#0A3D73]">
            <DialogTitle className="text-white text-xs font-bold flex items-center gap-3 uppercase tracking-widest">
              <ReceiptText size={18} /> Registrar Faturamento Real
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[#0A3D73] font-bold text-[9px] uppercase tracking-tighter">Número da NF</Label>
                <Input value={formData.numero_nf} onChange={(e) => setFormData({...formData, numero_nf: e.target.value})} placeholder="000.000" required className={sapInput} />
              </div>
              <div className="space-y-1">
                <Label className="text-[#0A3D73] font-bold text-[9px] uppercase tracking-tighter">Parcelamento</Label>
                <Select value={formData.numero_parcelas} onValueChange={(v) => setFormData({...formData, numero_parcelas: v})}>
                  <SelectTrigger className={sapSelectTrigger}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white rounded-none border-slate-300">
                    <SelectItem value="1">1 parcela</SelectItem>
                    <SelectItem value="2">2 parcelas</SelectItem>
                    <SelectItem value="3">3 parcelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[#0A3D73] font-bold text-[9px] uppercase tracking-tighter">Selecionar Pedido Origem</Label>
              <Select value={formData.pedido_id} onValueChange={(v) => setFormData({...formData, pedido_id: v})}>
                <SelectTrigger className={sapSelectTrigger}>
                  <SelectValue placeholder="Busque pelo Nº Fábrica ou Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-none border-slate-300 max-h-64">
                  {pedidos.filter(p => p.status !== 'FATURADO').map(p => (
                    <SelectItem key={p.id} value={p.id.toString()} className="text-[10px] uppercase font-bold cursor-pointer">
                      {p.numero_fabrica || 'S/REF'} - {p.cliente_nome?.split(' ')[0]} ({p.item_nome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 bg-blue-50 p-4 border border-blue-100">
              <Label className="text-blue-800 font-bold text-[9px] uppercase flex items-center gap-1">
                <DollarSign size={10}/> Valor Faturado (Total da NF)
              </Label>
              <Input 
                value={formData.valor_total} 
                onChange={(e) => setFormData({...formData, valor_total: e.target.value})} 
                placeholder="0,00" 
                required 
                className={`${sapInput} text-lg font-black text-blue-900`} 
              />
              <p className="text-[8px] text-blue-500 italic mt-1">* Insira o valor real da NF (com a variação de 10%)</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
               <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cronograma de Vencimentos</Label>
               <div className="grid gap-2">
                  <Input type="date" value={formData.data_p1} onChange={(e) => setFormData({...formData, data_p1: e.target.value})} required className={sapInput} />
                  {formData.numero_parcelas >= "2" && <Input type="date" value={formData.data_p2} onChange={(e) => setFormData({...formData, data_p2: e.target.value})} required className={sapInput} />}
                  {formData.numero_parcelas >= "3" && <Input type="date" value={formData.data_p3} onChange={(e) => setFormData({...formData, data_p3: e.target.value})} required className={sapInput} />}
               </div>
            </div>

            <Button type="submit" className="w-full bg-[#0A3D73] text-white rounded-none text-[10px] font-bold uppercase py-6 shadow-xl">
              Confirmar Faturamento e Gerar Comissões
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotasFiscais;