import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Package, Search, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const Pedidos = () => {
  const { isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Estados para o Autocomplete de Cliente
  const [clienteInput, setClienteInput] = useState('');
  const [showClientesRef, setShowClientesRef] = useState(false);

  const [formData, setFormData] = useState({
    cliente_nome: '',
    item_nome: '',
    quantidade: '',
    data_entrega: '',
    numero_fabrica: '', // Este é o nosso FE
    numero_oc: '',
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

  // Lista de clientes únicos para o Autocomplete (extraída dos pedidos existentes)
  const listaClientes = useMemo(() => {
    const nomes = pedidos.map(p => p.cliente_nome?.toUpperCase()).filter(Boolean);
    return [...new Set(nomes)].sort();
  }, [pedidos]);

  // Função para simular a busca de Produto pelo FE
  // Na vida real, você pode criar uma tabela de 'Produtos' no banco e buscar via API
  const buscarProdutoPorFE = (fe) => {
    const pedidoEncontrado = pedidos.find(p => p.numero_fabrica === fe);
    if (pedidoEncontrado) {
      setFormData(prev => ({ ...prev, item_nome: pedidoEncontrado.item_nome, numero_fabrica: fe }));
    } else {
      setFormData(prev => ({ ...prev, numero_fabrica: fe }));
    }
  };

  const formatarBR = (valor, casas = 2) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor || 0);
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
    setClienteInput(p.cliente_nome || '');
    setFormData({
      cliente_nome: p.cliente_nome || '',
      item_nome: p.item_nome || '',
      quantidade: p.quantidade || '',
      data_entrega: p.data_entrega || '',
      numero_fabrica: p.numero_fabrica || '',
      numero_oc: p.numero_oc || '', 
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
        data_entrega: '', numero_fabrica: '', numero_oc: '',
        condicao_pagamento: '', valor_total: '', peso_total: '', status: 'PENDENTE' 
    });
    setClienteInput('');
    setEditingPedido(null);
  };

  const filteredPedidos = pedidos.filter(p => {
    const termo = searchTerm.toLowerCase();
    return (p.cliente_nome?.toLowerCase().includes(termo)) ||
           (p.numero_fabrica?.toLowerCase().includes(termo)) ||
           (p.numero_oc?.toLowerCase().includes(termo)) ||
           (p.item_nome?.toLowerCase().includes(termo));
  });

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-10 outline-none transition-all w-full text-xs font-bold uppercase";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800 text-left">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-blue-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">Gestão Comercial</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Carteira de Pedidos</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase h-12">
           <Plus size={16} className="mr-2"/> Novo Pedido
        </Button>
      </div>

      {/* TABELA PRINCIPAL */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-[#555555] text-white text-[10px] font-bold uppercase">
              <tr>
                <th className="px-3 py-3 border-r border-gray-600 text-left">Cliente</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">FE</th>
                <th className="px-3 py-3 border-r border-gray-600 text-left">OC Cliente</th>
                <th className="px-3 py-3 border-r border-gray-600 text-left">Produto / Item</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Data</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Peso (KG)</th>
                <th className="px-3 py-3 border-r border-gray-600 text-center">Qtde</th>
                <th className="px-3 py-3 border-r border-gray-600 text-right">R$ / KG</th>
                <th className="px-3 py-3 border-r border-gray-600 text-right">Total</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPedidos.map((p) => (
                <tr key={p.id} onClick={() => handleEdit(p)} className="hover:bg-blue-50 cursor-pointer text-[11px] text-slate-700">
                  <td className="px-3 py-2 border-r border-gray-100 uppercase font-black">{p.cliente_nome || '---'}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-center font-mono font-bold text-blue-700 bg-blue-50/20">{p.numero_fabrica || '---'}</td>
                  <td className="px-3 py-2 border-r border-gray-100 font-bold text-amber-700">{p.numero_oc || '---'}</td>
                  <td className="px-3 py-2 border-r border-gray-100 font-bold uppercase">{p.item_nome || '---'}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-center">{p.data_entrega ? new Date(p.data_entrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-center font-bold">{formatarBR(p.peso_total)}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-center font-bold">{Number(p.quantidade || 0).toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-right font-black text-blue-600">{formatarBR((p.valor_total/p.peso_total))}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-right font-bold bg-slate-50/50">R$ {formatarBR(p.valor_total)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black border ${p.status === 'FATURADO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DE CADASTRO COM CASCATA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#0A3D73] text-white text-left">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2"><Package size={16}/> Formulário de Pedido</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CLIENTE COM AUTOCOMPLETE */}
              <div className="space-y-1 relative">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Cliente (Digite para buscar)</Label>
                <Input 
                  value={clienteInput} 
                  onChange={e => {
                    setClienteInput(e.target.value);
                    setFormData({...formData, cliente_nome: e.target.value.toUpperCase()});
                    setShowClientesRef(true);
                  }}
                  onFocus={() => setShowClientesRef(true)}
                  className={sapInput}
                  placeholder="NOME DO CLIENTE..."
                />
                {showClientesRef && clienteInput.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-slate-300 shadow-xl max-h-40 overflow-y-auto mt-1">
                    {listaClientes.filter(c => c.includes(clienteInput.toUpperCase())).map(cliente => (
                      <div 
                        key={cliente}
                        onClick={() => {
                          setFormData({...formData, cliente_nome: cliente});
                          setClienteInput(cliente);
                          setShowClientesRef(false);
                        }}
                        className="p-2 text-[10px] font-bold uppercase hover:bg-blue-100 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                      >
                        {cliente} <Check size={12} className="text-blue-600"/>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FE (REFERÊNCIA FÁBRICA) */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-blue-700">FE (Ref. Fábrica)</Label>
                <Input 
                  value={formData.numero_fabrica} 
                  onChange={e => buscarProdutoPorFE(e.target.value.toUpperCase())} 
                  className={`${sapInput} border-blue-200 bg-blue-50/30`} 
                  placeholder="EX: 1234/26"
                />
              </div>

              {/* PRODUTO (PREENCHIDO PELO FE) */}
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Produto / Item (Auto-preenchido pelo FE)</Label>
                <Input value={formData.item_nome} onChange={e => setFormData({...formData, item_nome: e.target.value.toUpperCase()})} required className={sapInput} />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-amber-600">Nº OC Cliente</Label>
                <Input value={formData.numero_oc} onChange={e => setFormData({...formData, numero_oc: e.target.value})} className={sapInput} />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Data de Entrega</Label>
                <Input type="date" value={formData.data_entrega} onChange={e => setFormData({...formData, data_entrega: e.target.value})} required className={sapInput} />
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-50 p-3 border">
                <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase">Quantidade</Label>
                    <Input type="number" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} className={sapInput} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase">Peso (KG)</Label>
                    <Input value={formData.peso_total} onChange={e => setFormData({...formData, peso_total: e.target.value})} className={sapInput} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-blue-700">Valor Total</Label>
                    <Input value={formData.valor_total} onChange={e => setFormData({...formData, valor_total: e.target.value})} className={sapInput} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-bold uppercase px-8">Cancelar</Button>
              <Button type="submit" className="bg-[#0A3D73] text-white px-10 rounded-none text-[10px] font-bold uppercase h-12">Gravar Pedido</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;