import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, KeyRound, Users, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const FORM_INITIAL = { nome: '', email: '', password: '', role: 'vendedor' };
const SENHA_INITIAL = { nova_senha: '', confirmar: '' };
const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const inpSm = "w-full border border-slate-200 rounded-lg bg-white px-3 h-9 text-xs font-semibold text-slate-800 outline-none focus:border-[#0A3D73] transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";

const Usuarios = () => {
  const { user: userLogado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [senhaDialogOpen, setSenhaDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [senhaUser, setSenhaUser] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [senhaData, setSenhaData] = useState(SENHA_INITIAL);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  useEffect(() => { fetchUsuarios(); }, []);

  const fetchUsuarios = async () => {
    try { const r = await api.get('/usuarios'); setUsuarios(Array.isArray(r.data) ? r.data : []); }
    catch { toast.error('Erro ao carregar usuários'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) { await api.put(`/usuarios/${editingUser.id}`, { nome: formData.nome, email: formData.email, role: formData.role }); toast.success('Usuário atualizado!'); }
      else { if (formData.password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres'); await api.post('/usuarios', formData); toast.success('Usuário criado!'); }
      setDialogOpen(false); resetForm(); fetchUsuarios();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Erro ao salvar usuário'); }
  };

  const handleResetSenha = async (e) => {
    e.preventDefault();
    if (senhaData.nova_senha !== senhaData.confirmar) return toast.error('As senhas não coincidem');
    if (senhaData.nova_senha.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
    try { await api.put(`/usuarios/${senhaUser.id}/reset-senha`, { nova_senha: senhaData.nova_senha }); toast.success('Senha resetada!'); setSenhaDialogOpen(false); setSenhaData(SENHA_INITIAL); }
    catch { toast.error('Erro ao resetar senha'); }
  };

  const handleToggleAtivo = async (u) => {
    if (u.id === userLogado?.id) return toast.error('Você não pode desativar sua própria conta');
    try {
      if (u.ativo) { await api.put(`/usuarios/${u.id}/desativar`); toast.success('Usuário desativado!'); }
      else { await api.put(`/usuarios/${u.id}/ativar`); toast.success('Usuário reativado!'); }
      fetchUsuarios();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const handleDelete = async (u) => {
    if (u.id === userLogado?.id) return toast.error('Você não pode excluir sua própria conta');
    if (window.confirm(`Excluir permanentemente o usuário "${u.nome}"?`)) {
      try { await api.delete(`/usuarios/${u.id}`); toast.success('Usuário removido!'); fetchUsuarios(); }
      catch { toast.error('Erro ao deletar usuário'); }
    }
  };

  const handleEdit = (u) => { setEditingUser(u); setFormData({ nome: u.nome, email: u.email, password: '', role: u.role }); setDialogOpen(true); };
  const resetForm = () => { setFormData(FORM_INITIAL); setEditingUser(null); };

  const filteredUsuarios = usuarios.filter(u => !searchTerm || u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Usuários...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestão de Usuários</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Controle de Acesso · {usuarios.length} usuários</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="Nome ou e-mail..." className="text-xs font-semibold bg-transparent outline-none w-40 text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <button onClick={() => { resetForm(); setDialogOpen(true); }} className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
            <Plus size={14}/> Novo Usuário
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {label:'Total', value:usuarios.length, icon:Users, cor:'#374151', fundo:'#F9FAFB'},
          {label:'Admins', value:usuarios.filter(u=>u.role==='admin').length, icon:ShieldCheck, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Consultores', value:usuarios.filter(u=>u.role==='vendedor').length, icon:UserCheck, cor:'#166534', fundo:'#DCFCE7'},
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
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3 text-center">Perfil</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum usuário encontrado</p>
                </td></tr>
              ) : filteredUsuarios.map((u, idx) => {
                const isMe = u.id === userLogado?.id;
                const ativo = u.ativo !== false;
                return (
                  <tr key={u.id} className={`text-xs border-b border-slate-100 transition-colors ${idx%2===0?'bg-white':'bg-slate-50/60'} ${!ativo?'opacity-50':''} hover:bg-blue-50/30`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0A3D73] rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0">{u.nome?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <p className="font-black text-slate-900">{u.nome}</p>
                          {isMe && <p className="text-xs text-blue-600 font-black">← você</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${u.role==='admin'?'bg-blue-100 text-blue-700 border-blue-300':'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {u.role==='admin'?'⚙ Admin':'👤 Consultor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${ativo?'bg-emerald-100 text-emerald-700 border-emerald-300':'bg-red-100 text-red-600 border-red-300'}`}>
                        {ativo?'● Ativo':'○ Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(u)} title="Editar" className="w-8 h-8 flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit size={13}/></button>
                        <button onClick={() => { setSenhaUser(u); setSenhaDialogOpen(true); }} title="Resetar senha" className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><KeyRound size={13}/></button>
                        {!isMe && <button onClick={() => handleToggleAtivo(u)} title={ativo?'Desativar':'Reativar'} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${ativo?'hover:bg-red-50 text-slate-400 hover:text-red-500':'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}>{ativo?<UserX size={13}/>:<UserCheck size={13}/>}</button>}
                        {!isMe && <button onClick={() => handleDelete(u)} title="Excluir" className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={13}/></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG CRIAR/EDITAR */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black"><Users size={15}/> {editingUser?'Editar Usuário':'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Identificação</p>
              <div className="space-y-3">
                <div><label className={lbl}>Nome Completo *</label><Input value={formData.nome} onChange={e => setFormData({...formData,nome:e.target.value})} required className={inp} placeholder="Ex: João Silva"/></div>
                <div><label className={lbl}>E-mail *</label><Input type="email" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} required className={inp} placeholder="usuario@empresa.com"/></div>
                <div><label className={lbl}>Perfil de Acesso *</label>
                  <select value={formData.role} onChange={e => setFormData({...formData,role:e.target.value})} className={`${inpSm} cursor-pointer`}>
                    <option value="vendedor">👤 Consultor</option>
                    <option value="admin">⚙ Administrador</option>
                  </select>
                </div>
              </div>
            </div>
            {!editingUser && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">02 · Senha de Acesso</p>
                <div className="relative">
                  <label className={lbl}>Senha (mín. 6 caracteres) *</label>
                  <Input type={showSenha?'text':'password'} value={formData.password} onChange={e => setFormData({...formData,password:e.target.value})} required className={inp} placeholder="••••••••"/>
                  <button type="button" onClick={() => setShowSenha(s => !s)} className="absolute right-3 top-7 text-slate-400 hover:text-slate-600">{showSenha?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setDialogOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="px-8 py-2.5 text-xs font-black uppercase bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-xl transition-colors">{editingUser?'Salvar Alterações':'Criar Usuário'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESET SENHA */}
      <Dialog open={senhaDialogOpen} onOpenChange={(o) => { setSenhaDialogOpen(o); if (!o) setSenhaData(SENHA_INITIAL); }}>
        <DialogContent className="max-w-sm bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-slate-700 text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black"><KeyRound size={15}/> Resetar Senha — {senhaUser?.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetSenha} className="p-6 space-y-4">
            <div className="relative">
              <label className={lbl}>Nova Senha *</label>
              <Input type={showSenha?'text':'password'} value={senhaData.nova_senha} onChange={e => setSenhaData({...senhaData,nova_senha:e.target.value})} required className={inp} placeholder="••••••••"/>
              <button type="button" onClick={() => setShowSenha(s => !s)} className="absolute right-3 top-7 text-slate-400 hover:text-slate-600">{showSenha?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
            <div className="relative">
              <label className={lbl}>Confirmar Senha *</label>
              <Input type={showConfirmar?'text':'password'} value={senhaData.confirmar} onChange={e => setSenhaData({...senhaData,confirmar:e.target.value})} required className={inp} placeholder="••••••••"/>
              <button type="button" onClick={() => setShowConfirmar(s => !s)} className="absolute right-3 top-7 text-slate-400 hover:text-slate-600">{showConfirmar?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
            {senhaData.nova_senha && senhaData.confirmar && senhaData.nova_senha !== senhaData.confirmar && (
              <p className="text-xs text-red-600 font-bold">⚠ As senhas não coincidem</p>
            )}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setSenhaDialogOpen(false)} className="flex-1 px-4 py-2.5 text-xs font-black uppercase border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2.5 text-xs font-black uppercase bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-xl transition-colors">Confirmar Reset</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;