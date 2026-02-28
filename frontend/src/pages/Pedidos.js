import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Package, Plus, Check, Lock, Search, Edit3, Weight, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// CONSTANTES
// ============================================================
const STATUS_OPTIONS = ['PENDENTE', 'IMPLANTADO', 'NF_EMITIDA', 'CANCELADO'];

const STATUS_CONFIG = {
  PENDENTE:   { label: 'PENDENTE',   cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  IMPLANTADO: { label: 'IMPLANTADO', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  NF_EMITIDA: { label: 'NF EMITIDA', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELADO:  { label: 'CANCELADO',  cls: 'bg-red-100 text-red-700 border-red-300' },
};

const FORM_INITIAL = {
  numero_pedido_fabrica: '',
  numero_fe: '',
  item_nome: '',
  cliente_nome: '',
  numero_oc: '',
  data_entrega: '',
  quantidade: '',
  peso_unit: '',
  peso_total: '',
  preco_milheiro: '',
  valor_total: '',
  fator: '',
  comissao_percent: '',
  comissao_valor: '',
  status: 'PENDENTE',
};

// ============================================================
// HELPERS
// ============================================================
const fmt = (v, c = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);

const toNum = (v) => {
  if (!v && v !== 0) return 0;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
};

const fmtDate = (d) => {
  if (!d) return '---';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// ============================================================
// COMPONENTE
// ============================================================
const Pedidos = () => {
  const { isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [clienteInput, setClienteInput] = useState('');
  const [showClientesDrop, setShowClientesDrop] = useState(false);
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resPedidos, resMateriais, resClientes] = await Promise.all([
          api.get('/pedidos'),
          api.get('/materiais'),
          api.get('/clientes'),
        ]);
        setPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : []);
        setMateriais(Array.isArray(resMateriais.data) ? resMateriais.data : []);
        setClientesBase(Array.isArray(resClientes.data) ? resClientes.data : []);
      } catch { toast.error('Erro ao sincronizar dados'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fetchPedidos = async () => {
    try {
      const r = await api.get('/pedidos');
      setPedidos(Array.isArray(r.data) ? r.data : []);
    } catch { toast.error('Erro ao carregar pedidos'); }
  };

  const listaClientes = useMemo(() => {
    const set = new Set([
      ...clientesBase.map(c => c.nome?.toUpperCase()),
      ...pedidos.map(p => p.cliente_nome?.toUpperCase()),
    ].filter(Boolean));
    return [...set].sort();
  }, [clientesBase, pedidos]);

  const contadores = useMemo(() => {
    const c = { TODOS: pedidos.length, PENDENTE: 0, IMPLANTADO: 0, NF_EMITIDA: 0, CANCELADO: 0 };
    pedidos.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, [pedidos]);

  const totais = useMemo(() => {
    const lista = pedidos.filter(p => {
      const matchStatus = filterStatus === 'TODOS' || p.status === filterStatus;
      const termo = searchTerm.toLowerCase();
      const matchSearch = !termo ||
        p.cliente_nome?.toLowerCase().includes(termo) ||
        p.numero_fe?.toLowerCase().includes(termo) ||
        p.numero_oc?.toLowerCase().includes(termo) ||
        p.item_nome?.toLowerCase().includes(termo) ||
        p.numero_fabrica?.toLowerCase().includes(termo);
      return matchStatus && matchSearch;
    });
    return {
      lista,
      peso: lista.reduce((a, p) => a + toNum(p.peso_total), 0),
      valor: lista.reduce((a, p) => a + toNum(p.valor_total), 0),
      comissao: lista.reduce((a, p) => a + toNum(p.comissao_valor || p.itens?.[0]?.comissao_valor || 0), 0),
      qtde: lista.reduce((a, p) => a + (parseInt(p.quantidade) || 0), 0),
    };
  }, [pedidos, filterStatus, searchTerm]);

  // Preenche campos ao digitar FE
  const handleFEChange = (fe) => {
    const valor = fe.toUpperCase();
    const mat = materiais.find(m =>
      m.numero_fe?.toUpperCase() === valor || m.codigo?.toUpperCase() === valor
    );
    if (mat) {
      const pesoUnit = toNum(mat.peso_unit);
      const precoMilheiro = toNum(mat.preco_unit);
      const comissaoPercent = toNum(mat.comissao);
      const qtde = toNum(formData.quantidade);
      const pesoTotal = qtde * pesoUnit;
      const valorTotal = (qtde / 1000) * precoMilheiro;
      const fator = pesoUnit > 0 ? precoMilheiro / (pesoUnit * 1000) : 0;
      const comissaoValor = valorTotal * comissaoPercent / 100;
      setFormData(prev => ({
        ...prev,
        numero_fe: valor,
        item_nome: mat.nome || mat.descricao || '',
        peso_unit: String(mat.peso_unit || '').replace('.', ','),
        preco_milheiro: String(mat.preco_unit || '').replace('.', ','),
        comissao_percent: String(mat.comissao || '').replace('.', ','),
        peso_total: qtde > 0 ? fmt(pesoTotal) : '',
        valor_total: qtde > 0 ? fmt(valorTotal) : '',
        fator: fmt(fator),
        comissao_valor: qtde > 0 ? fmt(comissaoValor) : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, numero_fe: valor }));
    }
  };

  // Recalcula ao mudar quantidade
  const handleQtdeChange = (qtdeStr) => {
    const qtde = toNum(qtdeStr);
    const pesoUnit = toNum(formData.peso_unit);
    const precoMilheiro = toNum(formData.preco_milheiro);
    const comissaoPercent = toNum(formData.comissao_percent);
    const pesoTotal = qtde * pesoUnit;
    const valorTotal = (qtde / 1000) * precoMilheiro;
    const fator = pesoUnit > 0 ? precoMilheiro / (pesoUnit * 1000) : 0;
    const comissaoValor = valorTotal * comissaoPercent / 100;
    setFormData(prev => ({
      ...prev,
      quantidade: qtdeStr,
      peso_total: qtde > 0 ? fmt(pesoTotal) : '',
      valor_total: qtde > 0 ? fmt(valorTotal) : '',
      fator: fmt(fator),
      comissao_valor: qtde > 0 ? fmt(comissaoValor) : '',
    }));
  };

  // Recalcula comissão ao mudar %
  const handleComissaoPercentChange = (val) => {
    const comissaoPercent = toNum(val);
    const valorTotal = toNum(formData.valor_total);
    const comissaoValor = valorTotal * comissaoPercent / 100;
    setFormData(prev => ({ ...prev, comissao_percent: val, comissao_valor: fmt(comissaoValor) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      cliente_nome: formData.cliente_nome.toUpperCase(),
      item_nome: formData.item_nome.toUpperCase(),
      numero_fabrica: formData.numero_pedido_fabrica,
      numero_fe: formData.numero_fe,
      numero_oc: formData.numero_oc,
      data_entrega: formData.data_entrega,
      quantidade: parseInt(formData.quantidade) || 0,
      peso_total: toNum(formData.peso_total),
      valor_total: toNum(formData.valor_total),
      comissao_valor: toNum(formData.comissao_valor),
      status: formData.status,
      itens: [{
        material_id: '',
        quantidade: parseInt(formData.quantidade) || 0,
        peso_calculado: toNum(formData.peso_total),
        valor_unitario: toNum(formData.preco_milheiro),
        subtotal: toNum(formData.valor_total),
        comissao_percent: toNum(formData.comissao_percent),
        comissao_valor: toNum(formData.comissao_valor),
        ipi: 0,
      }],
    };
    try {
      if (editingPedido) {
        await api.put(`/pedidos/${editingPedido.id}`, payload);
        toast.success('Pedido atualizado!');
      } else {
        await api.post('/pedidos', payload);
        toast.success('Pedido registrado!');
      }
      setDialogOpen(false);
      resetForm();
      fetchPedidos();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao salvar pedido');
    }
  };

  const handleEdit = (p) => {
    if (p.status === 'NF_EMITIDA' && !isAdmin) {
      toast.error('Pedido com NF emitida — apenas administradores podem editar');
      return;
    }
    const item = p.itens?.[0] || {};
    setEditingPedido(p);
    setClienteInput(p.cliente_nome || '');
    setFormData({
      numero_pedido_fabrica: p.numero_fabrica || '',
      numero_fe: p.numero_fe || '',
      item_nome: p.item_nome || '',
      cliente_nome: p.cliente_nome || '',
      numero_oc: p.numero_oc || '',
      data_entrega: p.data_entrega || '',
      quantidade: String(p.quantidade || ''),
      peso_unit: '',
      peso_total: String(p.peso_total || '').replace('.', ','),
      preco_milheiro: String(item.valor_unitario || '').replace('.', ','),
      valor_total: String(p.valor_total || '').replace('.', ','),
      fator: p.peso_total > 0 ? fmt(toNum(p.valor_total) / toNum(p.peso_total)) : '0,00',
      comissao_percent: String(item.comissao_percent || '').replace('.', ','),
      comissao_valor: String(p.comissao_valor || item.comissao_valor || '').replace('.', ','),
      status: p.status || 'PENDENTE',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData(FORM_INITIAL);
    setClienteInput('');
    setEditingPedido(null);
  };

  const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold uppercase px-3 w-full outline-none transition-all";
  const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando Carteira...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão Comercial</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Carteira de Pedidos · {totais.lista.length} registros
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="Buscar..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-36 md:w-48"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
          >
            <Plus size={14} className="mr-1.5" /> Novo Pedido
          </Button>
        </div>
      </div>

      {/* TOTALIZADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Peso Total (KG)', value: fmt(totais.peso), icon: Weight, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Qtde Total', value: totais.qtde.toLocaleString('pt-BR'), icon: Package, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Valor Total', value: `R$ ${fmt(totais.valor)}`, icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Comissão Total', value: `R$ ${fmt(totais.comissao)}`, icon: TrendingUp, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 border ${item.bg}`}>
            <item.icon size={18} className={item.color} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{item.label}</p>
              <p className={`text-sm font-black ${item.color} font-mono`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS POR STATUS */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['TODOS', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border transition-all ${
              filterStatus === s
                ? 'bg-[#0A3D73] text-white border-[#0A3D73]'
                : 'bg-white text-slate-600 border-slate-300 hover:border-[#0A3D73] hover:text-[#0A3D73]'
            }`}
          >
            {s === 'TODOS' ? 'Todos' : STATUS_CONFIG[s]?.label} ({contadores[s] || 0})
          </button>
        ))}
      </div>

      {/* TABELA */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-[9px] font-black uppercase tracking-wider">
                {['Pedido', 'Produto (FE)', 'OC Cliente', 'Referência', 'Cliente', 'Entrega', 'Peso KG', 'Qtde', 'Vl. Milheiro', 'Fator R$/KG', 'Total R$', 'Comissão R$', 'Status'].map((h, i) => (
                  <th key={i} className={`px-3 py-3 border-r border-blue-800 whitespace-nowrap ${['Entrega', 'Peso KG', 'Qtde', 'Vl. Milheiro', 'Fator R$/KG', 'Total R$', 'Comissão R$'].includes(h) ? 'text-right' : 'text-left'} ${h === 'Status' ? 'text-center border-r-0' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {totais.lista.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <FileText size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : totais.lista.map((p, idx) => {
                const travado = p.status === 'NF_EMITIDA' && !isAdmin;
                const item = p.itens?.[0] || {};
                const fator = toNum(p.peso_total) > 0 ? toNum(p.valor_total) / toNum(p.peso_total) : 0;
                const comissaoValor = toNum(p.comissao_valor || item.comissao_valor || 0);
                const precoMilheiro = toNum(item.valor_unitario || 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => handleEdit(p)}
                    className={`text-[11px] border-b border-slate-100 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    } ${travado ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}`}
                  >
                    <td className="px-3 py-2 border-r border-slate-100 font-mono font-black text-[#0A3D73] whitespace-nowrap">
                      {p.numero_fabrica
                        ? <span className="flex items-center gap-1">{travado && <Lock size={9} />}{p.numero_fabrica}</span>
                        : <span className="text-slate-300 italic text-[10px]">— aguardando —</span>
                      }
                    </td>
                    <td className="px-3 py-2 border-r border-slate-100 font-mono font-bold text-blue-700 whitespace-nowrap">{p.numero_fe || '---'}</td>
                    <td className="px-3 py-2 border-r border-slate-100 font-bold text-amber-700 whitespace-nowrap">{p.numero_oc || '---'}</td>
                    <td className="px-3 py-2 border-r border-slate-100 font-bold uppercase max-w-[150px] truncate">{p.item_nome || '---'}</td>
                    <td className="px-3 py-2 border-r border-slate-100 font-black uppercase whitespace-nowrap">{p.cliente_nome || '---'}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right text-slate-600 whitespace-nowrap">{fmtDate(p.data_entrega)}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-bold whitespace-nowrap">{fmt(p.peso_total)}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-bold whitespace-nowrap">{(parseInt(p.quantidade) || 0).toLocaleString('pt-BR')}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-bold text-slate-600 whitespace-nowrap">{precoMilheiro > 0 ? `R$ ${fmt(precoMilheiro)}` : '---'}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-black text-blue-600 whitespace-nowrap">R$ {fmt(fator)}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-black text-slate-800 bg-slate-50/80 whitespace-nowrap">R$ {fmt(p.valor_total)}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-bold text-emerald-700 whitespace-nowrap">{comissaoValor > 0 ? `R$ ${fmt(comissaoValor)}` : '---'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[9px] font-black border ${STATUS_CONFIG[p.status]?.cls || STATUS_CONFIG.PENDENTE.cls}`}>
                        {STATUS_CONFIG[p.status]?.label || p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {totais.lista.length > 0 && (
              <tfoot>
                <tr className="bg-[#0A3D73] text-white text-[10px] font-black">
                  <td colSpan={6} className="px-3 py-2 text-right tracking-wider uppercase">
                    Totais ({totais.lista.length} pedidos):
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(totais.peso)}</td>
                  <td className="px-3 py-2 text-right font-mono">{totais.qtde.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right font-mono">R$ {fmt(totais.valor)}</td>
                  <td className="px-3 py-2 text-right font-mono">R$ {fmt(totais.comissao)}</td>
                  <td className="px-3 py-2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <Package size={15} />
              {editingPedido ? 'Editar Pedido' : 'Novo Pedido'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* BLOCO 1 — IDENTIFICAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Identificação
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={sapLabel}><Edit3 size={9} className="inline mr-1" />Nº Pedido Fábrica</label>
                  <Input value={formData.numero_pedido_fabrica} onChange={e => setFormData({ ...formData, numero_pedido_fabrica: e.target.value })} className={sapInput} placeholder="Preencher após implantação" />
                </div>
                <div>
                  <label className={`${sapLabel} text-blue-700`}>Produto (FE) *</label>
                  <Input value={formData.numero_fe} onChange={e => handleFEChange(e.target.value)} className={`${sapInput} border-blue-300 bg-blue-50/40`} placeholder="Ex: 1234/26" required />
                </div>
                <div>
                  <label className={`${sapLabel} text-amber-600`}>OC Cliente</label>
                  <Input value={formData.numero_oc} onChange={e => setFormData({ ...formData, numero_oc: e.target.value })} className={sapInput} />
                </div>
              </div>
            </div>

            {/* BLOCO 2 — CLIENTE & PRODUTO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                02 · Cliente & Produto
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <label className={sapLabel}>Cliente *</label>
                  <Input value={clienteInput} onChange={e => { setClienteInput(e.target.value); setFormData({ ...formData, cliente_nome: e.target.value.toUpperCase() }); setShowClientesDrop(true); }} onFocus={() => setShowClientesDrop(true)} className={sapInput} placeholder="Digite o nome..." required />
                  {showClientesDrop && clienteInput.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-300 shadow-xl max-h-36 overflow-y-auto">
                      {listaClientes.filter(c => c.includes(clienteInput.toUpperCase())).map(cliente => (
                        <div key={cliente} onClick={() => { setFormData({ ...formData, cliente_nome: cliente }); setClienteInput(cliente); setShowClientesDrop(false); }} className="px-3 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between">
                          {cliente} <Check size={11} className="text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={sapLabel}>Referência (Nome do Item) *</label>
                  <Input value={formData.item_nome} onChange={e => setFormData({ ...formData, item_nome: e.target.value.toUpperCase() })} className={sapInput} required />
                </div>
                <div>
                  <label className={sapLabel}>Data de Entrega *</label>
                  <Input type="date" value={formData.data_entrega} onChange={e => setFormData({ ...formData, data_entrega: e.target.value })} className={sapInput} required />
                </div>
                <div>
                  <label className={sapLabel}>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={`${sapInput} cursor-pointer`} disabled={formData.status === 'NF_EMITIDA' && !isAdmin}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* BLOCO 3 — VALORES */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                03 · Quantidades & Valores
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4">
                <div>
                  <label className={sapLabel}>Quantidade *</label>
                  <Input type="number" value={formData.quantidade} onChange={e => handleQtdeChange(e.target.value)} className={sapInput} required />
                </div>
                <div>
                  <label className={sapLabel}>Peso Unit (KG)</label>
                  <div className="h-9 flex items-center px-3 bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-500 font-mono">{formData.peso_unit || '—'}</div>
                </div>
                <div>
                  <label className={sapLabel}>Peso Total (KG)</label>
                  <div className="h-9 flex items-center px-3 bg-blue-50 border border-blue-200 text-[11px] font-black text-blue-800 font-mono">{formData.peso_total || '—'}</div>
                </div>
                <div>
                  <label className={`${sapLabel} text-amber-600`}>Vl. Milheiro R$</label>
                  <div className="h-9 flex items-center px-3 bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-800 font-mono">{formData.preco_milheiro || '—'}</div>
                </div>
                <div>
                  <label className={`${sapLabel} text-blue-700`}>Fator R$/KG</label>
                  <div className="h-9 flex items-center px-3 bg-blue-50 border border-blue-200 text-[11px] font-black text-blue-800 font-mono">R$ {formData.fator || '0,00'}</div>
                </div>
                <div>
                  <label className={`${sapLabel} text-emerald-700`}>Valor Total R$</label>
                  <div className="h-9 flex items-center px-3 bg-emerald-50 border border-emerald-300 text-[11px] font-black text-emerald-800 font-mono">R$ {formData.valor_total || '0,00'}</div>
                </div>
                <div>
                  <label className={`${sapLabel} text-green-700`}>Comissão %</label>
                  <Input value={formData.comissao_percent} onChange={e => handleComissaoPercentChange(e.target.value)} className={`${sapInput} border-green-300 bg-green-50/40`} placeholder="Ex: 2,5" />
                </div>
                <div>
                  <label className={`${sapLabel} text-green-700`}>Comissão R$</label>
                  <div className="h-9 flex items-center px-3 bg-green-50 border border-green-300 text-[11px] font-black text-green-800 font-mono">R$ {formData.comissao_valor || '0,00'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">Cancelar</Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-black uppercase h-10 tracking-widest">Gravar Pedido</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;