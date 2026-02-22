import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FilePlus, CheckCircle, Clock, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NotasFiscais = () => {
  const [notas, setNotas] = useState([]);
  const [vencimentos, setVencimentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do formulário atualizado para suportar datas manuais
  const [formData, setFormData] = useState({
    numero_nf: '',
    pedido_id: '',
    valor_total: '',
    numero_parcelas: '1',
    data_p1: '',
    data_p2: '',
    data_p3: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notasRes, vencimentosRes, pedidosRes] = await Promise.all([
        axios.get(`${API}/notas-fiscais`),
        axios.get(`${API}/vencimentos`),
        axios.get(`${API}/pedidos`)
      ]);
      setNotas(notasRes.data);
      setVencimentos(vencimentosRes.data);
      setPedidos(pedidosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Aqui enviamos as datas manuais para o backend
      const payload = {
        ...formData,
        valor_total: parseFloat(formData.valor_total),
        numero_parcelas: parseInt(formData.numero_parcelas),
        datas_manuais: [formData.data_p1, formData.data_p2, formData.data_p3].filter(d => d !== '')
      };
      await axios.post(`${API}/notas-fiscais`, payload);
      toast.success('Nota fiscal e parcelas criadas!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar nota fiscal');
    }
  };

  const handleMarcarPago = async (vencimentoId) => {
    try {
      const hoje = new Date().toISOString();
      await axios.put(`${API}/vencimentos/${vencimentoId}`, { 
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

  const filteredNotas = notas.filter(nota => {
    const info = getPedidoInfo(nota.pedido_id);
    return nota.numero_nf.toLowerCase().includes(searchTerm.toLowerCase()) ||
           info.fabrica?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financeiro / NFs</h1>
          <p className="text-slate-600">Controle de faturamento e comissões</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
          <FilePlus size={16} className="mr-2" /> Nova Nota Fiscal
        </Button>
      </div>

      <Card className="p-4 mb-6 bg-white border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por NF ou Nº da Fábrica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-slate-300"
          />
        </div>
      </Card>

      {/* Tabela de Vencimentos - Onde o dinheiro aparece */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarDays size={18} /> Próximos Vencimentos de Comissão
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">NF</th>
                <th className="px-4 py-3">Fábrica</th>
                <th className="px-4 py-3 text-center">Parcela</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor Parcela</th>
                <th className="px-4 py-3 text-right text-blue-700">Comissão</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vencimentos.map(venc => {
                const nota = notas.find(n => n.id === venc.nota_fiscal_id);
                const info = getPedidoInfo(nota?.pedido_id);
                return (
                  <tr key={venc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{nota?.numero_nf}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{info.fabrica}</td>
                    <td className="px-4 py-3 text-center">{venc.parcela}ª</td>
                    <td className="px-4 py-3 font-medium">
                      {new Date(venc.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">R$ {venc.valor.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-green-700">
                      R$ {venc.comissao_calculada.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        venc.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {venc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {venc.status !== 'Pago' && (
                        <Button size="sm" onClick={() => handleMarcarPago(venc.id)} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
                          <CheckCircle size={14} className="mr-1" /> Baixar
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Nova NF */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Lançar Nota Fiscal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número da NF</Label>
                <Input 
                  value={formData.numero_nf} 
                  onChange={(e) => setFormData({...formData, numero_nf: e.target.value})}
                  placeholder="000.000" required className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label>Nº Parcelas</Label>
                <Select value={formData.numero_parcelas} onValueChange={(v) => setFormData({...formData, numero_parcelas: v})}>
                  <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1">1 parcela</SelectItem>
                    <SelectItem value="2">2 parcelas</SelectItem>
                    <SelectItem value="3">3 parcelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pedido Relacionado</Label>
              <Select value={formData.pedido_id} onValueChange={(v) => setFormData({...formData, pedido_id: v})}>
                <SelectTrigger className="border-slate-300"><SelectValue placeholder="Selecione o pedido" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {pedidos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.numero_pedido_fabrica} - {p.cliente_nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Total da Nota</Label>
              <Input 
                type="number" step="0.01" value={formData.valor_total} 
                onChange={(e) => setFormData({...formData, valor_total: e.target.value})}
                placeholder="R$ 0,00" required className="border-slate-300"
              />
            </div>

            {/* Datas Manuais Dinâmicas */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Datas de Vencimento</p>
              <div>
                <Label className="text-xs">Vencimento Parcela 1</Label>
                <Input type="date" value={formData.data_p1} onChange={(e) => setFormData({...formData, data_p1: e.target.value})} required className="bg-white border-slate-300" />
              </div>
              {formData.numero_parcelas >= "2" && (
                <div>
                  <Label className="text-xs">Vencimento Parcela 2</Label>
                  <Input type="date" value={formData.data_p2} onChange={(e) => setFormData({...formData, data_p2: e.target.value})} required className="bg-white border-slate-300" />
                </div>
              )}
              {formData.numero_parcelas >= "3" && (
                <div>
                  <Label className="text-xs">Vencimento Parcela 3</Label>
                  <Input type="date" value={formData.data_p3} onChange={(e) => setFormData({...formData, data_p3: e.target.value})} required className="bg-white border-slate-300" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">Salvar Nota e Parcelas</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotasFiscais;