import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Target, TrendingUp, Users, PlusCircle, Lock, Search, Weight, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v, c = 1) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);
const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const inpSm = "w-full border border-slate-200 rounded-lg bg-white px-3 h-9 text-xs font-semibold text-slate-800 outline-none focus:border-[#0A3D73] transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";
const FORM_INITIAL = { cliente_id: '', mes: (new Date().getMonth() + 1).toString(), valor_ton: '', ano: 2026 };

const Metas = () => {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [notas, setNotas] = useState([]);
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
      const [cliRes, metaRes, pedRes, nfRes] = await Promise.all([api.get('/clientes'), api.get('/metas'), api.get('/pedidos'), api.get('/notas-fiscais')]);
      setClientes(Array.isArray(cliRes.data)?cliRes.data:[]); setMetas(Array.isArray(metaRes.data)?metaRes.data:[]);
      setPedidos(Array.isArray(pedRes.data)?pedRes.data:[]); setNotas(Array.isArray(nfRes.data)?nfRes.data:[]);
    } catch { toast.error('Erro ao sincronizar dados'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Apenas administradores podem definir metas');
    if (!formData.cliente_id || !formData.valor_ton) return toast.error('Selecione o cliente e a tonelagem');
    try {
      if (editingMeta) { await api.put(`/metas/${editingMeta.id}`, {...formData, ano:2026}); toast.success('Meta atualizada!'); }
      else { await api.post('/metas', {...formData, ano:2026}); toast.success('Meta cadastrada!'); }
      setDialogOpen(false); resetForm(); fetchData();
    } catch { toast.error('Erro ao salvar meta'); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir esta meta?')) {
      try { await api.delete(`/metas/${id}`); toast.success('Meta removida!'); fetchData(); }
      catch { toast.error('Erro ao deletar'); }
    }
  };

  const handleEdit = (meta) => { setEditingMeta(meta); setFormData({ cliente_id: meta.cliente_id||'', mes: meta.mes||selectedMonth, valor_ton: String(meta.valor_ton||''), ano: meta.ano||2026 }); setDialogOpen(true); };
  const resetForm = () => { setFormData({...FORM_INITIAL, mes: selectedMonth}); setEditingMeta(null); };

  const getNotasDoMes = (mes) => {
    const mesNum = parseInt(mes);
    return notas.filter(n => { const dataRef = n.data_emissao || n.criado_em?.substring(0,10); if (!dataRef) return false; const d = new Date(dataRef + 'T00:00:00'); return d.getMonth()+1 === mesNum && d.getFullYear() === 2026; });
  };

  const getProgresso = (clienteId) => {
    const meta = metas.find(m => m.cliente_id === clienteId && m.mes === selectedMonth);
    const metaTon = meta ? parseFloat(meta.valor_ton||0) : 0;
    const cliente = clientes.find(c => c.id === clienteId);
    const clienteNomePart = cliente?.nome?.toLowerCase().split(' ')[0] || '';
    const notasMes = getNotasDoMes(selectedMonth);
    const notasCliente = notasMes.filter(n => n.cliente_id === clienteId || (!n.cliente_id && clienteNomePart && n.cliente_nome?.toLowerCase().includes(clienteNomePart)));
    let realizadoKg = 0;
    for (const nota of notasCliente) { const pedido = pedidos.find(p => p.id === nota.pedido_id); if (pedido) realizadoKg += pedido.peso_total||0; }
    const realizado = realizadoKg / 1000;
    const pct = metaTon > 0 ? (realizado/metaTon)*100 : 0;
    return { meta: metaTon, realizado, pct, metaId: meta?.id };
  };

  const clientesFiltrados = clientes.filter(c => !searchTerm || c.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalMeta = clientesFiltrados.reduce((a,c) => a+getProgresso(c.id).meta, 0);
  const totalRealizado = clientesFiltrados.reduce((a,c) => a+getProgresso(c.id).realizado, 0);
  const pctGeral = totalMeta > 0 ? (totalRealizado/totalMeta)*100 : 0;
  const clientesComMeta = clientes.filter(c => getProgresso(c.id).meta > 0).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Metas...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">Performance por Cliente {!isAdmin && <Lock size={14} className="text-slate-400"/>}</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Metas de Tonelagem · {MESES[parseInt(selectedMonth)-1]} 2026</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="Buscar cliente..." className="text-xs font-semibold bg-transparent outline-none w-40 text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          {isAdmin && (
            <button onClick={() => { resetForm(); setDialogOpen(true); }} className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
              <PlusCircle size={14}/> Nova Meta
            </button>
          )}
        </div>
      </div>

      {/* SELETOR DE MÊS */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-5">
        {MESES_CURTOS.map((mes, idx) => {
          const m = (idx+1).toString();
          const temMeta = metas.some(mt => mt.mes === m);
          return (
            <button key={mes} onClick={() => setSelectedMonth(m)}
              className={`min-w-[56px] py-2 text-xs font-black uppercase tracking-wide transition-all rounded-lg relative ${selectedMonth===m?'bg-[#0A3D73] text-white shadow-sm':'bg-white text-slate-400 hover:bg-white/80 hover:text-slate-600 border border-slate-200'}`}>
              {mes}
              {temMeta && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"/>}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          {label:'Meta Global', value:`${fmt(totalMeta)} TON`, icon:Target, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Realizado', value:`${fmt(totalRealizado,3)} TON`, icon:TrendingUp, cor:'#166534', fundo:'#DCFCE7'},
          {label:'Clientes com Meta', value:clientesComMeta, icon:Users, cor:'#374151', fundo:'#F9FAFB'},
          {label:'Atingimento Geral', value:`${fmt(pctGeral)}%`, icon:Weight, cor: pctGeral>=100?'#166534':pctGeral>=70?'#1E40AF':'#9A3412', fundo: pctGeral>=100?'#DCFCE7':pctGeral>=70?'#EFF6FF':'#FEE2E2'},
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:k.fundo}}>
                <k.icon size={13} style={{color:k.cor}}/>
              </div>
            </div>
            <p className="text-lg font-black" style={{color:k.cor}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* BARRA GLOBAL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Progresso Global — {MESES[parseInt(selectedMonth)-1]}</p>
          <p className="text-xs font-black text-[#0A3D73]">{fmt(pctGeral)}% atingido</p>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${pctGeral>=100?'bg-emerald-500':'bg-[#0A3D73]'}`} style={{width:`${Math.min(pctGeral,100)}%`}}/>
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-slate-400 font-semibold">{fmt(totalRealizado,3)} TON realizados</p>
          <p className="text-xs text-slate-400 font-semibold">{fmt(totalMeta)} TON de meta</p>
        </div>
      </div>

      {/* LISTA CLIENTES */}
      <div className="space-y-2">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-slate-200"/>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum cliente encontrado</p>
          </div>
        ) : clientesFiltrados.map((cliente) => {
          const { meta, realizado, pct, metaId } = getProgresso(cliente.id);
          const temMeta = meta > 0;
          return (
            <div key={cliente.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-[#0A3D73]/30 hover:shadow-md transition-all p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-3 w-full md:w-1/3">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${pct>=100?'bg-emerald-100 text-emerald-700':temMeta?'bg-blue-50 text-[#0A3D73]':'bg-slate-100 text-slate-400'}`}>
                    <Users size={15}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-slate-900 truncate">{cliente.nome}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{temMeta?`Meta: ${fmt(meta)} TON`:'Sem meta definida'}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 md:px-4">
                  {temMeta ? (
                    <>
                      <div className="flex justify-between text-xs font-black mb-1">
                        <span className="text-slate-400">Progresso</span>
                        <span className={pct>=100?'text-emerald-600':'text-[#0A3D73]'}>{fmt(pct)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${pct>=100?'bg-emerald-500':'bg-[#0A3D73]'}`} style={{width:`${Math.min(pct,100)}%`}}/>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-1">{fmt(realizado,3)} / {fmt(meta)} TON</p>
                    </>
                  ) : <p className="text-xs text-slate-300 font-semibold italic">— sem meta para este mês —</p>}
                </div>
                <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
                  {temMeta && (
                    <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${pct>=100?'bg-emerald-100 text-emerald-700 border-emerald-300':pct>=70?'bg-blue-100 text-blue-700 border-blue-300':'bg-red-100 text-red-700 border-red-300'}`}>
                      {pct>=100?'✓ Atingido':pct>=70?'Em curso':'Abaixo'}
                    </span>
                  )}
                  {isAdmin && temMeta && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit({id:metaId,cliente_id:cliente.id,mes:selectedMonth,valor_ton:meta})} className="w-7 h-7 flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit size={12}/></button>
                      <button onClick={() => handleDelete(metaId)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={12}/></button>
                    </div>
                  )}
                  {!temMeta && isAdmin && (
                    <button onClick={() => { setFormData({cliente_id:cliente.id,mes:selectedMonth,valor_ton:'',ano:2026}); setDialogOpen(true); }} className="text-xs font-black text-[#0A3D73] hover:underline flex items-center gap-1">
                      <PlusCircle size={11}/> Definir meta
                    </button>
                  )}
                  <ChevronRight size={14} className="text-slate-200 ml-1"/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black"><Target size={15}/> {editingMeta?'Editar Meta':'Nova Meta Mensal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Configuração</p>
              <div className="space-y-3">
                <div><label className={lbl}>Cliente *</label>
                  <select value={formData.cliente_id} onChange={e => setFormData({...formData,cliente_id:e.target.value})} className={`${inpSm} cursor-pointer`} required>
                    <option value="">— Selecione o cliente —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Mês *</label>
                    <select value={formData.mes} onChange={e => setFormData({...formData,mes:e.target.value})} className={`${inpSm} cursor-pointer`}>
                      {MESES.map((m,i) => <option key={m} value={(i+1).toString()}>{m}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Meta (TON) *</label>
                    <Input type="number" step="0.1" min="0" value={formData.valor_ton} onChange={e => setFormData({...formData,valor_ton:e.target.value})} className={inp} placeholder="Ex: 50.0" required/>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setDialogOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="px-8 py-2.5 text-xs font-black uppercase bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-xl transition-colors">Gravar Meta</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Metas;