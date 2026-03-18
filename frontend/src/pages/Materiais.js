import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Search, MoreVertical, Package, Weight, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTOS = ['CAIXA', 'CHAPA', 'CORTE VINCO', 'SIMPLEX'];
const FORM_INITIAL = { numero_fe: '', descricao: '', segmento: 'CAIXA', peso_unit: '', comissao: '', preco_unit: '' };

const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";

const fmt = (v, c = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);
const toNum = (v) => { if (!v && v !== 0) return 0; return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0; };

const Materiais = () => {
  const { isAdmin } = useAuth();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegmento, setFilterSegmento] = useState('TODOS');
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    try {
      const r = await api.get('/materiais');
      setMateriais(Array.isArray(r.data) ? r.data : []);
    } catch { toast.error('Erro ao carregar catálogo'); }
    finally { setLoading(false); }
  };

  const fatorForm = () => {
    const peso = toNum(formData.peso_unit);
    const preco = toNum(formData.preco_unit);
    return peso > 0 ? fmt(preco / (peso * 1000)) : '0,00';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Ação não permitida');
    try {
      const data = {
        numero_fe: formData.numero_fe, codigo: formData.numero_fe,
        nome: formData.descricao, descricao: formData.descricao,
        segmento: formData.segmento,
        peso_unit: toNum(formData.peso_unit),
        comissao: toNum(formData.comissao),
        preco_unit: toNum(formData.preco_unit),
      };
      if (editingMaterial) { await api.put(`/materiais/${editingMaterial.id}`, data); toast.success('Material atualizado!'); }
      else { await api.post('/materiais', data); toast.success('Material cadastrado!'); }
      setDialogOpen(false); resetForm(); fetchMateriais();
    } catch { toast.error('Erro ao salvar material'); }
  };

  const handleEdit = (m) => {
    if (!isAdmin) return;
    setEditingMaterial(m);
    setFormData({
      numero_fe: m.numero_fe||m.codigo||'', descricao: m.nome||m.descricao||'',
      segmento: m.segmento||'CAIXA',
      peso_unit: String(m.peso_unit||'').replace('.',','),
      comissao: String(m.comissao||'').replace('.',','),
      preco_unit: String(m.preco_unit||'').replace('.',','),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este material permanentemente?')) {
      try { await api.delete(`/materiais/${id}`); toast.success('Material removido!'); fetchMateriais(); }
      catch { toast.error('Erro ao deletar'); }
    }
  };

  const resetForm = () => { setFormData(FORM_INITIAL); setEditingMaterial(null); };

  const filtered = materiais.filter(m => {
    const matchSearch = !searchTerm ||
      (m.nome||m.descricao||'').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.numero_fe||m.codigo||'').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeg = filterSegmento === 'TODOS' || m.segmento === filterSegmento;
    return matchSearch && matchSeg;
  });

  const contadores = materiais.reduce((acc, m) => { acc[m.segmento] = (acc[m.segmento]||0)+1; return acc; }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Catálogo...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Catálogo Base (FE)</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Produtos & Precificação · {filtered.length} registros</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="Buscar por FE ou descrição..." className="text-xs font-semibold bg-transparent outline-none w-44 text-slate-700"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          {isAdmin && (
            <button onClick={() => { resetForm(); setDialogOpen(true); }}
              className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
              <Plus size={14}/> Novo FE
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          {label:'Total de FEs', value:materiais.length, icon:Package, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Preço Médio Milheiro', value:`R$ ${fmt(materiais.reduce((a,m)=>a+(m.preco_unit||0),0)/(materiais.length||1))}`, icon:DollarSign, cor:'#166534', fundo:'#DCFCE7'},
          {label:'Comissão Média', value:`${fmt(materiais.reduce((a,m)=>a+(m.comissao||0),0)/(materiais.length||1))}%`, icon:TrendingUp, cor:'#0891B2', fundo:'#ECFEFF'},
          {label:'Peso Médio Unit.', value:`${fmt(materiais.reduce((a,m)=>a+(m.peso_unit||0),0)/(materiais.length||1),4)} kg`, icon:Weight, cor:'#374151', fundo:'#F9FAFB'},
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

      {/* FILTROS SEGMENTO */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['TODOS',...SEGMENTOS].map(s => (
          <button key={s} onClick={() => setFilterSegmento(s)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filterSegmento===s?'bg-[#0A3D73] text-white border-[#0A3D73] shadow-sm':'bg-white text-slate-600 border-slate-200 hover:border-[#0A3D73]'}`}>
            {s} <span className="opacity-60">({s==='TODOS'?materiais.length:contadores[s]||0})</span>
          </button>
        ))}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-xs font-black uppercase tracking-wide">
                <th className="px-4 py-3">FE</th>
                <th className="px-4 py-3">Descrição Técnica</th>
                <th className="px-4 py-3 text-center">Segmento</th>
                <th className="px-4 py-3 text-right">Peso Unit.</th>
                <th className="px-4 py-3 text-right">R$ Milheiro</th>
                <th className="px-4 py-3 text-right">Fator R$/KG</th>
                <th className="px-4 py-3 text-right">Comissão %</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin?8:7} className="text-center py-16 text-slate-400">
                  <Package size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum material encontrado</p>
                </td></tr>
              ) : filtered.map((m, idx) => {
                const fator = m.peso_unit > 0 ? m.preco_unit / (m.peso_unit * 1000) : 0;
                return (
                  <tr key={m.id} onClick={() => isAdmin && handleEdit(m)}
                    className={`text-xs border-b border-slate-100 transition-colors
                      ${idx%2===0?'bg-white':'bg-slate-50/60'}
                      ${isAdmin?'hover:bg-blue-50 cursor-pointer':''}`}>
                    <td className="px-4 py-2.5 font-mono font-black text-[#0A3D73] whitespace-nowrap">{m.numero_fe||m.codigo}</td>
                    <td className="px-4 py-2.5 font-bold uppercase max-w-[200px] truncate">{m.nome||m.descricao}</td>
                    <td className="px-4 py-2.5 text-center">
                      {m.segmento ? <span className="px-2 py-0.5 text-xs font-black border bg-slate-100 text-slate-600 border-slate-200 rounded-full whitespace-nowrap">{m.segmento}</span> : '---'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-600 whitespace-nowrap">{fmt(m.peso_unit,4)} kg</td>
                    <td className="px-4 py-2.5 text-right font-bold whitespace-nowrap">R$ {fmt(m.preco_unit)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-[#0A3D73] whitespace-nowrap">R$ {fmt(fator)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-emerald-700 whitespace-nowrap">{fmt(m.comissao)}%</td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                              <MoreVertical size={14} className="text-slate-400"/>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl bg-white">
                            <DropdownMenuItem onClick={() => handleEdit(m)} className="text-xs font-bold gap-2 cursor-pointer p-3 rounded-lg">
                              <Edit size={13} className="text-[#0A3D73]"/> Alterar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-xs font-bold gap-2 cursor-pointer text-red-600 p-3 rounded-lg">
                              <Trash2 size={13}/> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black">
              <Package size={15}/> {editingMaterial?'Editar Material (FE)':'Novo Material (FE)'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Identificação */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Identificação</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Número do FE *</label>
                  <Input value={formData.numero_fe} onChange={e => setFormData({...formData, numero_fe:e.target.value.toUpperCase()})} required className={inp} placeholder="Ex: 1234/26"/>
                </div>
                <div>
                  <label className={lbl}>Segmento</label>
                  <select value={formData.segmento} onChange={e => setFormData({...formData, segmento:e.target.value})} className={`${inp} cursor-pointer`}>
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Nome do Produto *</label>
                  <Input value={formData.descricao} onChange={e => setFormData({...formData, descricao:e.target.value.toUpperCase()})} required className={inp} placeholder="Descrição técnica do produto"/>
                </div>
              </div>
            </div>

            {/* Precificação */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">02 · Precificação</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div>
                  <label className={lbl}>Peso Unit. (KG)</label>
                  <Input value={formData.peso_unit} onChange={e => setFormData({...formData, peso_unit:e.target.value})} className={inp} placeholder="0,000000"/>
                </div>
                <div>
                  <label className={lbl}>R$ Milheiro</label>
                  <Input value={formData.preco_unit} onChange={e => setFormData({...formData, preco_unit:e.target.value})} className={inp} placeholder="0,00"/>
                </div>
                <div>
                  <label className={lbl}>Comissão %</label>
                  <Input value={formData.comissao} onChange={e => setFormData({...formData, comissao:e.target.value})} className={`${inp} border-emerald-200`} placeholder="Ex: 2,5"/>
                </div>
                <div>
                  <label className={lbl}>Fator R$/KG</label>
                  <div className="h-10 flex items-center px-3 bg-[#EFF6FF] border border-[#0A3D73]/20 rounded-lg text-xs font-black text-[#0A3D73]">R$ {fatorForm()}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setDialogOpen(false)}
                className="px-6 py-2.5 text-xs font-black uppercase border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button type="submit"
                className="px-8 py-2.5 text-xs font-black uppercase bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-xl transition-colors tracking-wide">
                Gravar Material
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materiais;