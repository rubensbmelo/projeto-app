import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Search, MoreVertical, Package, Weight, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTOS = ['CAIXA', 'CHAPA', 'CORTE VINCO', 'SIMPLEX'];

const FORM_INITIAL = {
  numero_fe: '',
  descricao: '',
  segmento: 'CAIXA',
  peso_unit: '',
  comissao: '',
  preco_unit: '',
};

const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold uppercase px-3 w-full outline-none transition-all";
const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

const fmt = (v, c = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);

const toNum = (v) => {
  if (!v && v !== 0) return 0;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
};

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
      const response = await api.get('/materiais');
      setMateriais(Array.isArray(response.data) ? response.data : []);
    } catch { toast.error('Erro ao carregar catálogo'); }
    finally { setLoading(false); }
  };

  // Fator calculado em tempo real no formulário
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
        numero_fe: formData.numero_fe,
        codigo: formData.numero_fe,
        nome: formData.descricao,
        descricao: formData.descricao,
        segmento: formData.segmento,
        peso_unit: toNum(formData.peso_unit),
        comissao: toNum(formData.comissao),
        preco_unit: toNum(formData.preco_unit),
      };
      if (editingMaterial) {
        await api.put(`/materiais/${editingMaterial.id}`, data);
        toast.success('Material atualizado!');
      } else {
        await api.post('/materiais', data);
        toast.success('Material cadastrado!');
      }
      setDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch { toast.error('Erro ao salvar material'); }
  };

  const handleEdit = (m) => {
    if (!isAdmin) return;
    setEditingMaterial(m);
    setFormData({
      numero_fe: m.numero_fe || m.codigo || '',
      descricao: m.nome || m.descricao || '',
      segmento: m.segmento || 'CAIXA',
      peso_unit: String(m.peso_unit || '').replace('.', ','),
      comissao: String(m.comissao || '').replace('.', ','),
      preco_unit: String(m.preco_unit || '').replace('.', ','),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este material permanentemente?')) {
      try {
        await api.delete(`/materiais/${id}`);
        toast.success('Material removido!');
        fetchMateriais();
      } catch { toast.error('Erro ao deletar'); }
    }
  };

  const resetForm = () => {
    setFormData(FORM_INITIAL);
    setEditingMaterial(null);
  };

  const filtered = materiais.filter(m => {
    const matchSearch = !searchTerm ||
      (m.nome || m.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.numero_fe || m.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeg = filterSegmento === 'TODOS' || m.segmento === filterSegmento;
    return matchSearch && matchSeg;
  });

  // Contadores por segmento
  const contadores = materiais.reduce((acc, m) => {
    acc[m.segmento] = (acc[m.segmento] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Catálogo...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Catálogo Base (FE)</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Produtos & Precificação · {filtered.length} registros
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="Buscar por FE ou descrição..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-44"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
            >
              <Plus size={14} className="mr-1.5" /> Novo FE
            </Button>
          )}
        </div>
      </div>

      {/* TOTALIZADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total de FEs', value: materiais.length, icon: Package, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Preço Médio Milheiro', value: `R$ ${fmt(materiais.reduce((a, m) => a + (m.preco_unit || 0), 0) / (materiais.length || 1))}`, icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Comissão Média', value: `${fmt(materiais.reduce((a, m) => a + (m.comissao || 0), 0) / (materiais.length || 1))}%`, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Peso Médio Unit.', value: `${fmt(materiais.reduce((a, m) => a + (m.peso_unit || 0), 0) / (materiais.length || 1), 4)} kg`, icon: Weight, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
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

      {/* FILTROS POR SEGMENTO */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {['TODOS', ...SEGMENTOS].map(s => (
          <button
            key={s}
            onClick={() => setFilterSegmento(s)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border transition-all ${
              filterSegmento === s
                ? 'bg-[#0A3D73] text-white border-[#0A3D73]'
                : 'bg-white text-slate-600 border-slate-300 hover:border-[#0A3D73] hover:text-[#0A3D73]'
            }`}
          >
            {s} ({s === 'TODOS' ? materiais.length : contadores[s] || 0})
          </button>
        ))}
      </div>

      {/* TABELA */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-[9px] font-black uppercase tracking-wider">
                <th className="px-4 py-3 border-r border-blue-800">FE</th>
                <th className="px-4 py-3 border-r border-blue-800">Descrição Técnica</th>
                <th className="px-4 py-3 border-r border-blue-800 text-center">Segmento</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">Peso Unit.</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">R$ Milheiro</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">Fator R$/KG</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">Comissão %</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Package size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhum material encontrado
                  </td>
                </tr>
              ) : filtered.map((m, idx) => {
                const fator = m.peso_unit > 0 ? m.preco_unit / (m.peso_unit * 1000) : 0;
                return (
                  <tr
                    key={m.id}
                    onClick={() => isAdmin && handleEdit(m)}
                    className={`text-[11px] border-b border-slate-100 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    } ${isAdmin ? 'hover:bg-blue-50 cursor-pointer' : ''}`}
                  >
                    <td className="px-4 py-2.5 border-r border-slate-100 font-mono font-black text-blue-800 whitespace-nowrap">
                      {m.numero_fe || m.codigo}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 font-bold uppercase max-w-[200px] truncate">
                      {m.nome || m.descricao}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                      {m.segmento ? (
                        <span className="px-2 py-0.5 text-[9px] font-black border bg-slate-100 text-slate-600 border-slate-200 whitespace-nowrap">
                          {m.segmento}
                        </span>
                      ) : '---'}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right font-bold text-slate-600 whitespace-nowrap">
                      {fmt(m.peso_unit, 4)} kg
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right font-bold whitespace-nowrap">
                      R$ {fmt(m.preco_unit)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right font-black text-blue-700 bg-blue-50/50 whitespace-nowrap">
                      R$ {fmt(fator)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right font-black text-emerald-700 whitespace-nowrap">
                      {fmt(m.comissao)}%
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-100">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white rounded-none border-slate-300 shadow-xl">
                            <DropdownMenuItem onClick={() => handleEdit(m)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer p-3">
                              <Edit size={13} className="text-blue-600" /> Alterar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer text-red-600 p-3">
                              <Trash2 size={13} /> Excluir
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
      </Card>

      {/* DIALOG FORMULÁRIO */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <Package size={15} />
              {editingMaterial ? 'Editar Material (FE)' : 'Novo Material (FE)'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">

            {/* BLOCO 1 — IDENTIFICAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Identificação
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`${sapLabel} text-blue-700`}>Número do FE *</label>
                  <Input
                    value={formData.numero_fe}
                    onChange={e => setFormData({ ...formData, numero_fe: e.target.value.toUpperCase() })}
                    required
                    className={`${sapInput} border-blue-300 bg-blue-50/40`}
                    placeholder="Ex: 1234/26"
                  />
                </div>
                <div>
                  <label className={sapLabel}>Segmento</label>
                  <select
                    value={formData.segmento}
                    onChange={e => setFormData({ ...formData, segmento: e.target.value })}
                    className={`${sapInput} cursor-pointer`}
                  >
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={sapLabel}>Nome do Produto *</label>
                  <Input
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                    required
                    className={sapInput}
                    placeholder="Descrição técnica do produto"
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 2 — PRECIFICAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                02 · Precificação
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4">
                <div>
                  <label className={sapLabel}>Peso Unit. (KG)</label>
                  <Input
                    value={formData.peso_unit}
                    onChange={e => setFormData({ ...formData, peso_unit: e.target.value })}
                    className={sapInput}
                    placeholder="0,000000"
                  />
                </div>
                <div>
                  <label className={`${sapLabel} text-amber-600`}>R$ Milheiro</label>
                  <Input
                    value={formData.preco_unit}
                    onChange={e => setFormData({ ...formData, preco_unit: e.target.value })}
                    className={`${sapInput} border-amber-200 bg-amber-50/30`}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className={`${sapLabel} text-emerald-700`}>Comissão %</label>
                  <Input
                    value={formData.comissao}
                    onChange={e => setFormData({ ...formData, comissao: e.target.value })}
                    className={`${sapInput} border-green-200 bg-green-50/30`}
                    placeholder="Ex: 2,5"
                  />
                </div>
                <div>
                  <label className={`${sapLabel} text-blue-700`}>Fator R$/KG</label>
                  <div className="h-9 flex items-center px-3 bg-blue-50 border border-blue-200 text-[11px] font-black text-blue-800 font-mono">
                    R$ {fatorForm()}
                  </div>
                </div>
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col md:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-black uppercase h-10 tracking-widest">
                Gravar Material
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materiais;