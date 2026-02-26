import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingCart, Search, Lock, Trash2, Plus, CalendarDays, Package, Calculator, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Pedidos = () => {
  const { isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('todos');
  
  // Estado para Criação de Pedido
  const [selectedCliente, setSelectedCliente] = useState('');
  const [itens, setItens] = useState([{ material_id: '', quantidade: 1, peso_calculado: 0, preco_total_item: 0 }]);

  const nomesMeses = [
    { v: '1', l: 'Janeiro' }, { v: '2', l: 'Fevereiro' }, { v: '3', l: 'Março' },
    { v: '4', l: 'Abril' }, { v: '5', l: 'Maio' }, { v: '6', l: 'Junho' },
    { v: '7', l: 'Julho' }, { v: '8', l: 'Agosto' }, { v: '9', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, clientesRes, materiaisRes] = await Promise.all([
        api.get('/pedidos'),
        api.get('/clientes'),
        api.get('/materiais')
      ]);
      setPedidos(Array.isArray(pedidosRes.data) ? pedidosRes.data : []);
      setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      setMateriais(Array.isArray(materiaisRes.data) ? materiaisRes.data : []);
    } catch (error) {
      toast.error('Erro ao sincronizar dados do servidor');
    } finally { setLoading(false); }
  };

  const adicionarItem = () => {
    setItens([...itens, { material_id: '', quantidade: 1, peso_calculado: 0, preco_total_item: 0 }]);
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itens];
    novosItens[index][campo] = valor;

    if (campo === 'material_id' || campo === 'quantidade') {
      const material = materiais.find(m => m.id === novosItens[index].material_id);
      if (material) {
        const qtd = parseFloat(novosItens[index].quantidade) || 0;
        novosItens[index].peso_calculado = (material.peso_unit || 0) * qtd;
        novosItens[index].preco_total_item = (material.preco_unit || 0) * qtd;
      }
    }
    setItens(novosItens);
  };

  const handleSalvarPedido = async (e) => {
    e.preventDefault();
    if (!selectedCliente || itens.some(i => !i.material_id)) {
      return toast.error("Selecione o cliente e os materiais corretamente");
    }

    try {
      const pesoTotal = itens.reduce((acc, i) => acc + i.peso_calculado, 0);
      const valorTotal = itens.reduce((acc, i) => acc + i.preco_total_item, 0);

      const payload = {
        cliente_id: selectedCliente,
        itens: itens.map(i => ({
          material_id: i.material_id,
          quantidade: parseInt(i.quantidade),
          peso_calculado: parseFloat(i.peso_calculado)
        })),
        status: "Pendente",
        valor_total: valorTotal,
        peso_total: pesoTotal
      };

      await api.post('/pedidos', payload);
      toast.success("Pedido registrado com sucesso!");
      setDialogOpen(false);
      setSelectedCliente('');
      setItens([{ material_id: '', quantidade: 1, peso_calculado: 0, preco_total_item: 0 }]);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar pedido no banco");
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const clienteObj = clientes.find(c => c.id === p.cliente_id);
    const nomeBusca = (clienteObj?.nome || clienteObj?.razao_social || '').toLowerCase();
    const matchesSearch = nomeBusca.includes(searchTerm.toLowerCase());
    
    const dataPedido = p.created_at ? new Date(p.created_at) : new Date();
    const mesPedido = (dataPedido.getMonth() + 1).toString();
    const matchesMonth = selectedMonth === 'todos' || mesPedido === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  if (loading) return <div className="p-10 text-center font-bold text-[#0A3D73] animate-pulse">CARREGANDO SISTEMA DE PEDIDOS...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center border-b-2 border-blue-900 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 uppercase flex items-center gap-2 tracking-tighter">
              <ShoppingCart className="text-blue-900" size={28} /> Gestão Comercial
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">ERP Vendas • 2026</p>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0A3D73] hover:bg-blue-900 text-white rounded-none px-6 font-bold uppercase text-xs h-12 shadow-md transition-all">
                  <Plus size={18} className="mr-2" /> Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white rounded-none p-0 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-[#0A3D73] text-white">
                  <DialogTitle className="uppercase text-sm font-black flex items-center gap-2">
                    <Package size={20}/> Entrada de Pedido de Venda
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSalvarPedido} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-blue-900">Cliente Requisitante</Label>
                      <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                        <SelectTrigger className="rounded-none border-slate-300 h-11 bg-slate-50"><SelectValue placeholder="Localizar cliente..." /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome || c.razao_social || c.cnpj}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2">
                      <Label className="text-[10px] font-black uppercase text-blue-900 italic">Itens da Composição</Label>
                      <Button type="button" onClick={adicionarItem} variant="outline" className="text-[9px] font-bold uppercase rounded-none h-8 border-blue-900 text-blue-900 hover:bg-blue-50">
                        + Incluir Material
                      </Button>
                    </div>

                    {itens.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 border border-slate-200">
                        <div className="col-span-6 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-500">Material / SKU</Label>
                          <Select value={item.material_id} onValueChange={(v) => atualizarItem(index, 'material_id', v)}>
                            <SelectTrigger className="h-10 rounded-none bg-white border-slate-300 text-xs"><SelectValue placeholder="Escolha o produto..." /></SelectTrigger>
                            <SelectContent className="bg-white">
                              {materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.nome || m.descricao}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-500">Quantidade</Label>
                          <Input type="number" className="h-10 rounded-none bg-white text-center font-bold" value={item.quantidade} onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)} />
                        </div>
                        <div className="col-span-3 text-right">
                            <p className="text-[8px] uppercase text-slate-400 font-bold">Peso Est.</p>
                            <p className="text-xs font-mono font-bold text-slate-700">{Number(item.peso_calculado).toFixed(2)} kg</p>
                        </div>
                        <div className="col-span-1 text-right">
                          <Button type="button" onClick={() => removerItem(index)} variant="ghost" className="text-red-400 hover:text-red-600 h-10"><Trash2 size={18}/></Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0A3D73] p-6 flex justify-between items-center text-white">
                    <div className="flex gap-10">
                      <div>
                        <p className="text-[9px] uppercase opacity-60 font-bold">Carga Total</p>
                        <p className="text-xl font-mono font-bold">{itens.reduce((acc, i) => acc + i.peso_calculado, 0).toFixed(2)} KG</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase opacity-60 font-bold">Valor Bruto</p>
                        <p className="text-xl font-mono font-bold text-green-400">R$ {itens.reduce((acc, i) => acc + i.preco_total_item, 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-none px-12 font-black uppercase text-xs h-12 border-b-4 border-green-800">
                      Confirmar e Salvar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* BUSCA E FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 border border-slate-300 shadow-sm">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400" size={18} />
            <Input 
              placeholder="Pesquisar por cliente..." 
              className="pl-10 rounded-none border-slate-200 italic h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-blue-900" size={20} />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="rounded-none border-slate-200 h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="todos">Filtro: Todos os Meses</SelectItem>
                {nomesMeses.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end font-bold text-[#0A3D73] text-xs gap-4">
            <span className="uppercase tracking-widest opacity-60">Volume Financeiro:</span>
            <span className="bg-blue-900 text-white px-4 py-2 text-sm font-mono">
              R$ {pedidosFiltrados.reduce((acc, p) => acc + (p.valor_total || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE PEDIDOS COM FATOR */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0A3D73] text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-4 border-r border-blue-800/30">Status</th>
                <th className="p-4 border-r border-blue-800/30">Cliente</th>
                <th className="p-4 border-r border-blue-800/30 text-right">Peso Total</th>
                <th className="p-4 border-r border-blue-800/30 text-right">Valor Total</th>
                <th className="p-4 border-r border-blue-800/30 text-right bg-blue-900">Fator Médio (R$/kg)</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center italic text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                    Nenhum registro encontrado na base de dados.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => {
                  const fatorMedio = p.peso_total > 0 ? (p.valor_total / p.peso_total) : 0;
                  const clienteObj = clientes.find(c => c.id === p.cliente_id);
                  
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors border-l-4 border-transparent hover:border-blue-900">
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase border ${
                          p.status === 'Pendente' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-xs uppercase text-slate-900">
                          {clienteObj?.nome || clienteObj?.razao_social || "CLIENTE NÃO IDENTIFICADO"}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono italic">Doc ID: {p.id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-xs">{Number(p.peso_total || 0).toFixed(2)} kg</td>
                      <td className="p-4 text-right font-bold text-slate-900 text-sm">R$ {Number(p.valor_total || 0).toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-blue-700 bg-blue-50/50 text-sm">
                        R$ {fatorMedio.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-900">
                          <Eye size={16}/>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Pedidos;