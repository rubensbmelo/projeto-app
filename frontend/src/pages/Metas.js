import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Target, TrendingUp, Users, PlusCircle, Lock, Search, Weight, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const fmt = (v, c = 1) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);

const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold uppercase px-3 w-full outline-none transition-all";
const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

const FORM_INITIAL = { cliente_id: '', mes: (new Date().getMonth() + 1).toString(), valor_ton: '', ano: 2026 };

const Metas = () => {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cliRes, metaRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/metas'),
      ]);
      setClientes(Array.isArray(cliRes.data) ? cliRes.data : []);
      setMetas(Array.isArray(metaRes.data) ? metaRes.data : []);
    } catch { toast.error('Erro ao sincronizar dados de performance'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Apenas administradores podem definir metas');
    if (!formData.cliente_id || !formData.valor_ton) return toast.error('Selecione o cliente e a tonelagem');
    try {
      if (editingMeta) {
        await api.put(`/metas/${editingMeta.id}`, { ...formData, ano: 2026 });
        toast.success('Meta atualizada!');
      } else {
        await api.post('/metas', { ...formData, ano: 2026 });
        toast.success('Meta cadastrada!');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch { toast.error('Erro ao salvar meta'); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir esta meta?')) {
      try {
        await api.delete(`/metas/${id}`);
        toast.success('Meta removida!');
        fetchData();
      } catch { toast.error('Erro ao deletar'); }
    }
  };

  const handleEdit = (meta) => {
    setEditingMeta(meta);
    setFormData({
      cliente_id: meta.cliente_id || '',
      mes: meta.mes || selectedMonth,
      valor_ton: String(meta.valor_ton || ''),
      ano: meta.ano || 2026,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ ...FORM_INITIAL, mes: selectedMonth });
    setEditingMeta(null);
  };

  // Calcula progresso de um cliente no mês selecionado
  // Realizado zerado até módulo de NF ser construído
  const getProgresso = (clienteId) => {
    const meta = metas.find(m => m.cliente_id === clienteId && m.mes === selectedMonth);
    const metaTon = meta ? parseFloat(meta.valor_ton || 0) : 0;
    const realizado = 0; // 🔜 será preenchido com dados de NF quando o módulo estiver pronto
    const pct = metaTon > 0 ? (realizado / metaTon) * 100 : 0;
    return { meta: metaTon, realizado, pct, metaId: meta?.id };
  };

  const clientesFiltrados = clientes.filter(c =>
    !searchTerm || c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totais do mês
  const totalMeta = clientesFiltrados.reduce((a, c) => a + getProgresso(c.id).meta, 0);
  const totalRealizado = 0; // 🔜 idem
  const pctGeral = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;
  const clientesComMeta = clientes.filter(c => getProgresso(c.id).meta > 0).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Metas...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Performance por Cliente
            {!isAdmin && <Lock size={14} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Metas de Tonelagem · {MESES[parseInt(selectedMonth) - 1]} 2026
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="Buscar cliente..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-40"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
            >
              <PlusCircle size={14} className="mr-1.5" /> Nova Meta
            </Button>
          )}
        </div>
      </div>

      {/* SELETOR DE MÊS */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {MESES_CURTOS.map((mes, idx) => {
          const m = (idx + 1).toString();
          const temMeta = metas.some(mt => mt.mes === m);
          return (
            <button
              key={mes}
              onClick={() => setSelectedMonth(m)}
              className={`min-w-[60px] py-2 text-[9px] font-black uppercase tracking-wider transition-all border-b-2 relative ${
                selectedMonth === m
                  ? 'border-[#0A3D73] text-[#0A3D73] bg-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:bg-white/60 hover:text-slate-600'
              }`}
            >
              {mes}
              {temMeta && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* TOTALIZADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Meta Global', value: `${fmt(totalMeta)} TON`, icon: Target, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Realizado', value: `${fmt(totalRealizado, 3)} TON`, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', note: '🔜 aguarda NF' },
          { label: 'Clientes com Meta', value: clientesComMeta, icon: Users, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Atingimento Geral', value: `${fmt(pctGeral)}%`, icon: Weight, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', note: '🔜 aguarda NF' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 border ${item.bg}`}>
            <item.icon size={18} className={item.color} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{item.label}</p>
              <p className={`text-sm font-black ${item.color} font-mono`}>{item.value}</p>
              {item.note && <p className="text-[8px] text-slate-400 font-bold mt-0.5">{item.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* BARRA PROGRESSO GLOBAL */}
      <div className="bg-white border border-slate-200 p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Progresso Global — {MESES[parseInt(selectedMonth) - 1]}</p>
          <p className="text-[9px] font-black text-[#0A3D73]">{fmt(pctGeral)}% atingido</p>
        </div>
        <div className="w-full bg-slate-100 h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${pctGeral >= 100 ? 'bg-emerald-500' : 'bg-[#0A3D73]'}`}
            style={{ width: `${Math.min(pctGeral, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[8px] text-slate-400 font-bold">{fmt(totalRealizado, 3)} TON realizados</p>
          <p className="text-[8px] text-slate-400 font-bold">{fmt(totalMeta)} TON de meta</p>
        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="space-y-2">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum cliente encontrado</p>
          </div>
        ) : clientesFiltrados.map((cliente, idx) => {
          const { meta, realizado, pct, metaId } = getProgresso(cliente.id);
          const temMeta = meta > 0;
          return (
            <div
              key={cliente.id}
              className={`bg-white border transition-all ${
                idx % 2 === 0 ? 'border-slate-200' : 'border-slate-100'
              } hover:border-[#0A3D73]/30 hover:shadow-sm`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">

                {/* CLIENTE */}
                <div className="flex items-center gap-3 w-full md:w-1/3">
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                    pct >= 100 ? 'bg-emerald-100 text-emerald-700' : temMeta ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Users size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase text-slate-900 truncate">{cliente.nome}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      {temMeta ? `Meta: ${fmt(meta)} TON` : 'Sem meta definida'}
                    </p>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO */}
                <div className="w-full md:w-1/3 md:px-4">
                  {temMeta ? (
                    <>
                      <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                        <span className="text-slate-400">Progresso</span>
                        <span className={pct >= 100 ? 'text-emerald-600' : 'text-[#0A3D73]'}>{fmt(pct)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#0A3D73]'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[8px] text-slate-400 font-bold mt-1">
                        {fmt(realizado, 3)} / {fmt(meta)} TON
                      </p>
                    </>
                  ) : (
                    <p className="text-[9px] text-slate-300 font-bold italic">— sem meta para este mês —</p>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
                  {temMeta && (
                    <span className={`px-2 py-0.5 text-[9px] font-black border ${
                      pct >= 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : pct >= 70
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {pct >= 100 ? '✓ ATINGIDO' : pct >= 70 ? 'EM CURSO' : 'ABAIXO'}
                    </span>
                  )}
                  {isAdmin && temMeta && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit({ id: metaId, cliente_id: cliente.id, mes: selectedMonth, valor_ton: meta })}
                        className="w-7 h-7 flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(metaId)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  {!temMeta && isAdmin && (
                    <button
                      onClick={() => {
                        setFormData({ cliente_id: cliente.id, mes: selectedMonth, valor_ton: '', ano: 2026 });
                        setDialogOpen(true);
                      }}
                      className="text-[9px] font-black uppercase text-[#0A3D73] hover:underline flex items-center gap-1"
                    >
                      <PlusCircle size={11} /> Definir meta
                    </button>
                  )}
                  <ChevronRight size={14} className="text-slate-200 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <Target size={15} />
              {editingMeta ? 'Editar Meta' : 'Nova Meta Mensal'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Configuração
              </p>
              <div className="space-y-3">
                <div>
                  <label className={sapLabel}>Cliente *</label>
                  <select
                    value={formData.cliente_id}
                    onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                    className={`${sapInput} cursor-pointer`}
                    required
                  >
                    <option value="">— Selecione o cliente —</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={sapLabel}>Mês *</label>
                    <select
                      value={formData.mes}
                      onChange={e => setFormData({ ...formData, mes: e.target.value })}
                      className={`${sapInput} cursor-pointer`}
                    >
                      {MESES.map((m, i) => (
                        <option key={m} value={(i + 1).toString()}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`${sapLabel} text-blue-700`}>Meta (TON) *</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.valor_ton}
                      onChange={e => setFormData({ ...formData, valor_ton: e.target.value })}
                      className={`${sapInput} border-blue-300 bg-blue-50/40`}
                      placeholder="Ex: 50.0"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-black uppercase h-10 tracking-widest">
                Gravar Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Metas;