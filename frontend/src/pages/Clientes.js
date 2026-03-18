import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, Lock, Users, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const FORM_INITIAL = {
  nome: '', cnpj: '', endereco: '', cidade: '', estado: '',
  comprador: '', telefone: '', email: ''
};

const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";

const Clientes = () => {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const r = await api.get('/clientes');
      setClientes(Array.isArray(r.data) ? r.data : []);
    } catch {
      toast.error('Erro ao carregar clientes');
      setClientes([]);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Acesso negado');
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, formData);
        toast.success('Cadastro atualizado!');
      } else {
        await api.post('/clientes', formData);
        toast.success('Cliente registrado!');
      }
      setDialogOpen(false); resetForm(); fetchClientes();
    } catch { toast.error('Erro ao salvar cliente'); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este cliente permanentemente?')) {
      try {
        await api.delete(`/clientes/${id}`);
        toast.success('Registro removido');
        fetchClientes();
      } catch { toast.error('Erro ao deletar'); }
    }
  };

  const resetForm = () => { setFormData(FORM_INITIAL); setEditingCliente(null); };

  const handleEdit = (c) => {
    setEditingCliente(c);
    setFormData({ nome: c.nome||'', cnpj: c.cnpj||'', endereco: c.endereco||'', cidade: c.cidade||'', estado: c.estado||'', comprador: c.comprador||'', telefone: c.telefone||'', email: c.email||''});
    setDialogOpen(true);
  };

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.nome?.toLowerCase().includes(s) || c.cnpj?.toLowerCase().includes(s) || c.cidade?.toLowerCase().includes(s) || c.comprador?.toLowerCase().includes(s);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Clientes...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clientes</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Gestão de Carteira · {filteredClientes.length} registros</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="Nome, CNPJ, cidade..." className="text-xs font-semibold bg-transparent outline-none w-44 text-slate-700"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          {isAdmin ? (
            <button onClick={() => { resetForm(); setDialogOpen(true); }}
              className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
              <Plus size={14}/> Novo Cliente
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 text-slate-400 text-xs font-bold rounded-lg">
              <Lock size={12}/> Modo Visualização
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        {[
          {label:'Total de Clientes', value:clientes.length, icon:Users, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Resultado da Busca', value:filteredClientes.length, icon:Search, cor:'#374151', fundo:'#F9FAFB'},
          {label:'Estados Atendidos', value:[...new Set(clientes.map(c=>c.estado).filter(Boolean))].length, icon:MapPin, cor:'#166534', fundo:'#DCFCE7'},
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:k.fundo}}>
                <k.icon size={13} style={{color:k.cor}}/>
              </div>
            </div>
            <p className="text-xl font-black" style={{color:k.cor}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-xs font-black uppercase tracking-wide">
                <th className="px-4 py-3">Razão Social</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Contato</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr><td colSpan={isAdmin?6:5} className="text-center py-16 text-slate-400">
                  <Building2 size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum cliente encontrado</p>
                </td></tr>
              ) : filteredClientes.map((c, idx) => (
                <tr key={c.id} onClick={() => isAdmin && handleEdit(c)}
                  className={`text-xs border-b border-slate-100 transition-colors cursor-pointer
                    ${idx%2===0?'bg-white':'bg-slate-50/60'} hover:bg-blue-50`}>
                  <td className="px-4 py-3">
                    <p className="font-black text-slate-900 uppercase text-xs">{c.nome}</p>
                    {c.email && <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1"><Mail size={9}/>{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-600 whitespace-nowrap">{c.cnpj||'---'}</td>
                  <td className="px-4 py-3 font-bold uppercase whitespace-nowrap">
                    {c.comprador||<span className="text-slate-300 italic font-normal">— não informado —</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-bold uppercase text-slate-700">{c.cidade||'---'}{c.estado?` — ${c.estado}`:''}</p>
                    {c.endereco && <p className="text-xs text-slate-400 font-semibold mt-0.5">{c.endereco}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.telefone
                      ? <p className="font-bold text-slate-700 flex items-center gap-1"><Phone size={10} className="text-slate-400"/>{c.telefone}</p>
                      : <span className="text-slate-300 italic font-normal">— não informado —</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical size={14} className="text-slate-400"/>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl bg-white">
                          <DropdownMenuItem onClick={() => handleEdit(c)} className="text-xs font-bold gap-2 cursor-pointer p-3 rounded-lg">
                            <Edit size={13} className="text-[#0A3D73]"/> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-xs font-bold gap-2 cursor-pointer text-red-600 p-3 rounded-lg">
                            <Trash2 size={13}/> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black">
              <Building2 size={15}/> {editingCliente?'Editar Cliente':'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* Identificação */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Identificação</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={lbl}>Razão Social *</label>
                  <Input value={formData.nome} onChange={e => setFormData({...formData, nome:e.target.value.toUpperCase()})} required className={inp}/>
                </div>
                <div>
                  <label className={lbl}>CNPJ / Documento *</label>
                  <Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj:e.target.value})} required className={inp} placeholder="00.000.000/0000-00"/>
                </div>
                <div>
                  <label className={lbl}>Comprador / Contato</label>
                  <Input value={formData.comprador} onChange={e => setFormData({...formData, comprador:e.target.value.toUpperCase()})} className={inp}/>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">02 · Localização</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="md:col-span-2">
                  <label className={lbl}>Endereço</label>
                  <Input value={formData.endereco} onChange={e => setFormData({...formData, endereco:e.target.value})} className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Cidade</label>
                  <Input value={formData.cidade} onChange={e => setFormData({...formData, cidade:e.target.value.toUpperCase()})} className={inp}/>
                </div>
                <div>
                  <label className={lbl}>UF</label>
                  <Input value={formData.estado} onChange={e => setFormData({...formData, estado:e.target.value.toUpperCase()})} maxLength={2} className={inp} placeholder="PE"/>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">03 · Contato</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>E-mail Corporativo</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email:e.target.value})} className={inp} placeholder="contato@empresa.com.br"/>
                </div>
                <div>
                  <label className={lbl}>Telefone / WhatsApp</label>
                  <Input value={formData.telefone} onChange={e => setFormData({...formData, telefone:e.target.value})} className={inp} placeholder="(81) 99999-9999"/>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}
                className="rounded-xl text-xs font-black uppercase px-6 h-10 border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancelar
              </Button>
              <Button type="submit"
                className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-8 rounded-xl text-xs font-black uppercase h-10 tracking-wide">
                Salvar Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;