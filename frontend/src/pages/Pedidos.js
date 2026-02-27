import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Edit, Package, Search, CheckCircle2, Clock, Hash, Scale, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const Pedidos = () => {
  const { isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  const [formData, setFormData] = useState({
    cliente_nome: '',
    item_nome: '',
    quantidade: '',
    data_entrega: '',
    numero_fabrica: '',
    condicao_pagamento: '',
    valor_total: '',
    peso_total: '',
    status: 'PENDENTE'
  });

  useEffect(() => { fetchPedidos(); }, []);

  const fetchPedidos = async () => {
    try {
      const response = await api.get('/pedidos');
      setPedidos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally { setLoading(false); }
  };

  const formatarBR = (valor, casas = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(valor || 0);
  };

  const limparParaNumero = (v) => {
    if (!v) return 0;
    return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      quantidade: parseInt(formData.quantidade) || 0,
      valor_total: limparParaNumero(formData.valor_total),
      peso_total: limparParaNumero(formData.peso_total)
    };

    try {
      if (editingPedido) {
        await api.put(`/pedidos/${editingPedido.id}`, payload);
        toast.success('Pedido atualizado');
      } else {
        await api.post('/pedidos', payload);
        toast.success('Pedido registrado');
      }
      setDialogOpen(false);
      resetForm();
      fetchPedidos();
    } catch (error) {
      toast.error('Erro ao salvar pedido');
    }
  };

  const handleEdit = (p) => {
    setEditingPedido(p);
    setFormData({
      cliente_nome: p.cliente_nome || '',
      item_nome: p.item_nome || '',
      quantidade: p.quantidade || '',
      data_entrega: p.data_entrega || '',
      numero_fabrica: p.numero_fabrica || '',
      condicao_pagamento: p.condicao_pagamento || '',
      valor_total: String(p.valor_total || '').replace('.', ','),
      peso_total: String(p.peso_total || '').replace('.', ','),
      status: p.status || 'PENDENTE'
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ 
        cliente_nome: '', item_nome: '', quantidade: '', 
        data_entrega: '', numero_fabrica: '', condicao_pagamento: '', 
        valor_total: '', peso_total: '', status: 'PENDENTE' 
    });
    setEditingPedido(null);
  };

  const filteredPedidos = pedidos.filter(p => {
    const termo = searchTerm.toLowerCase();
    const matchTexto = 
      (p.cliente_nome?.toLowerCase().includes(termo)) ||
      (p.numero_fabrica?.toLowerCase().includes(termo)) ||
      (p.item_nome?.toLowerCase().includes(termo));
    const matchData = searchDate === '' || p.data_entrega === searchDate;
    return matchTexto && matchData;
  });

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-10 outline-none transition-all";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight">Gestão Comercial</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Carteira de Pedidos Ativos</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase py-6 shadow-md">
           <Plus size={16} className="mr-2"/> Novo Pedido
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-6 items-end">
        <div className="flex-1 w-full relative">
          <Label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Pesquisar Cliente / Fábrica / Item</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="DIGITE A BUSCA..." 
              className={`${sapInput} pl-10 w-full text-[10px] uppercase font-bold`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48 relative">
          <Label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Filtrar por Entrega</Label>
          <Input 
            type="date"
            className={`${sapInput} mt-1 text-[10px] font-bold`}
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
        {(searchTerm || searchDate) && (
            <Button variant="ghost" onClick={() => { setSearchTerm(''); setSearchDate(''); }} className="h-10 text-red-600 font-bold text-[9px] uppercase">
                <X size={14} className="mr-1"/> Limpar
            </Button>
        )}
      </div>

      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-[#555555] text-white text-[10px] font-bold uppercase">
              <tr>
                <th className="px-3 py-3 border-r border-gray-600 text-center whitespace-nowrap">Ref. Fábrica</th>
                <th className="px-3 py-3 border-r border-gray-600 text-left">Produto / Item</th>
                <th className="px-3 py-3 border-r border-gray-600 text-left">Cliente</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Data</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Peso (KG)</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Qtde</th>
                <th className="px-3 py-3 border-r border-gray-600 text-right">R$ / KG</th>
                <th className="px-3 py-3 border-r border-gray-600 text-right">Total Pedido</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Status</th>
                <th className="px-3 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPedidos.length > 0 ? filteredPedidos.map((p) => {
                const valorTotal = parseFloat(p.valor_total) || 0;
                const pesoTotal = parseFloat(p.peso_total) || 0;
                const qtd = parseFloat(p.quantidade) || 0;
                const fatorMedio = pesoTotal > 0 ? (valorTotal / pesoTotal) : 0;
                const isFaturado = p.status === 'FATURADO';

                return (
                  <tr key={p.id || Math.random()} className={`hover:bg-blue-50/50 text-[11px] text-slate-700 transition-colors ${isFaturado ? 'opacity-70 bg-gray-50' : ''}`}>
                    {/* 1. REF FÁBRICA */}
                    <td className="px-3 py-2 border-r border-gray-100 text-center font-mono font-bold">
                      {p.numero_fabrica || '---'}
                    </td>

                    {/* 2. PRODUTO */}
                    <td className="px-3 py-2 border-r border-gray-100 font-bold uppercase text-blue-800">
                      {p.item_nome || '---'}
                    </td>

                    {/* 3. CLIENTE */}
                    <td className="px-3 py-2 border-r border-gray-100 uppercase font-medium">
                      {p.cliente_nome || '---'}
                    </td>

                    {/* 4. DATA */}
                    <td className="px-3 py-2 border-r border-gray-100 text-center">
                      {p.data_entrega ? new Date(p.data_entrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}
                    </td>

                    {/* 5. PESO */}
                    <td className="px-3 py-2 border-r border-gray-100 text-center font-bold">
                      {formatarBR(pesoTotal)}
                    </td>

                    {/* 6. QTDE */}
                    <td className="px-3 py-2 border-r border-gray-100 text-center font-bold text-slate-900">
                      {qtd.toLocaleString('pt-BR')}
                    </td>

                    {/* 7. R$ / KG (FATOR) */}
                    <td className="px-3 py-2 border-r border-gray-100 text-right font-black text-blue-600">
                      {formatarBR(fatorMedio)}
                    </td>

                    {/* 8. TOTAL PEDIDO */}
                    <td className="px-3 py-2 border-r border-gray-100 text-right font-bold bg-slate-50/50">
                      R$ {formatarBR(valorTotal)}
                    </td>

                    {/* 9. STATUS */}
                    <td className="px-3 py-2 border-r border-gray-100 text-center">
                      <span className={`px-2 py-0.5 inline-block text-[9px] font-black border ${
                        isFaturado 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {p.status || 'PENDENTE'}
                      </span>
                    </td>

                    {/* 10. AÇÃO */}
                    <td className="px-3 py-2 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-7 w-7 p-0 text-blue-600 hover:text-blue-900">
                        <Edit size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400 font-bold uppercase text-xs italic">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl font-sans text-slate-800">
          <DialogHeader className="p-6 bg-[#0A3D73] text-white text-left">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
              <Package size={16}/> Gestão de Pedido Comercial
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Cliente</Label>
                <Input value={formData.cliente_nome} onChange={e => setFormData({...formData, cliente_nome: e.target.value})} required className={sapInput} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Produto / Item</Label>
                <Input value={formData.item_nome} onChange={e => setFormData({...formData, item_nome: e.target.value})} required className={sapInput} />
              </div>
              
              <div className="col-span-2 grid grid-cols-2 gap-4 bg-blue-50/50 p-4 border border-blue-100">
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-blue-800">Quantidade</Label>
                    <Input type="number" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} className={sapInput} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-blue-800">Peso Total (KG)</Label>
                    <Input value={formData.peso_total} onChange={e => setFormData({...formData, peso_total: e.target.value})} className={sapInput} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500 text-blue-700">Valor Total (R$)</Label>
                <Input value={formData.valor_total} onChange={e => setFormData({...formData, valor_total: e.target.value})} className={`${sapInput} font-bold text-blue-900 border-blue-200`} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Data de Entrega</Label>
                <Input type="date" value={formData.data_entrega} onChange={e => setFormData({...formData, data_entrega: e.target.value})} required className={sapInput} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Referência Fábrica</Label>
                <Input value={formData.numero_fabrica} onChange={e => setFormData({...formData, numero_fabrica: e.target.value})} className={sapInput} placeholder="0000/00" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Condição Pagamento</Label>
                <Input value={formData.condicao_pagamento} onChange={e => setFormData({...formData, condicao_pagamento: e.target.value})} className={sapInput} />
              </div>
              
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Status do Pedido</Label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full h-10 border border-slate-300 px-3 text-xs font-bold uppercase outline-none bg-white focus:border-blue-800 transition-all"
                  >
                    <option value="PENDENTE">⏳ PENDENTE</option>
                    <option value="FATURADO">✅ FATURADO</option>
                  </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-bold uppercase px-8 border-slate-300">Cancelar</Button>
              <Button type="submit" className="bg-[#0A3D73] text-white px-10 rounded-none text-[10px] font-bold uppercase py-6 shadow-lg hover:bg-blue-800 transition-all">
                Gravar Pedido
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;