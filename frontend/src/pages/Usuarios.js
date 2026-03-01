import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, KeyRound, Users, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const FORM_INITIAL = { nome: '', email: '', password: '', role: 'vendedor' };
const SENHA_INITIAL = { nova_senha: '', confirmar: '' };

const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold px-3 w-full outline-none transition-all";
const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

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
    try {
      const res = await api.get('/usuarios');
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Erro ao carregar usuários'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, {
          nome: formData.nome,
          email: formData.email,
          role: formData.role,
        });
        toast.success('Usuário atualizado!');
      } else {
        if (formData.password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
        await api.post('/usuarios', formData);
        toast.success('Usuário criado!');
      }
      setDialogOpen(false);
      resetForm();
      fetchUsuarios();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const handleResetSenha = async (e) => {
    e.preventDefault();
    if (senhaData.nova_senha !== senhaData.confirmar)
      return toast.error('As senhas não coincidem');
    if (senhaData.nova_senha.length < 6)
      return toast.error('Senha deve ter no mínimo 6 caracteres');
    try {
      await api.put(`/usuarios/${senhaUser.id}/reset-senha`, { nova_senha: senhaData.nova_senha });
      toast.success('Senha resetada com sucesso!');
      setSenhaDialogOpen(false);
      setSenhaData(SENHA_INITIAL);
    } catch { toast.error('Erro ao resetar senha'); }
  };

  const handleToggleAtivo = async (u) => {
    if (u.id === userLogado?.id) return toast.error('Você não pode desativar sua própria conta');
    try {
      if (u.ativo) {
        await api.put(`/usuarios/${u.id}/desativar`);
        toast.success('Usuário desativado!');
      } else {
        await api.put(`/usuarios/${u.id}/ativar`);
        toast.success('Usuário reativado!');
      }
      fetchUsuarios();
    } catch { toast.error('Erro ao alterar status'); }
  };

  const handleDelete = async (u) => {
    if (u.id === userLogado?.id) return toast.error('Você não pode excluir sua própria conta');
    if (window.confirm(`Excluir permanentemente o usuário "${u.nome}"?`)) {
      try {
        await api.delete(`/usuarios/${u.id}`);
        toast.success('Usuário removido!');
        fetchUsuarios();
      } catch { toast.error('Erro ao deletar usuário'); }
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({ nome: u.nome, email: u.email, password: '', role: u.role });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData(FORM_INITIAL);
    setEditingUser(null);
  };

  const filteredUsuarios = usuarios.filter(u => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return u.nome?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  const totalAdmin    = usuarios.filter(u => u.role === 'admin').length;
  const totalVendedor = usuarios.filter(u => u.role === 'vendedor').length;
  const totalAtivos   = usuarios.filter(u => u.ativo !== false).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Usuários...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Usuários</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Controle de Acesso · {usuarios.length} usuários
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="Nome ou e-mail..."
              className="text-[11px] font-bold bg-transparent outline-none w-40"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
          >
            <Plus size={14} className="mr-1.5" /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* TOTALIZADORES */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total',       value: usuarios.length, icon: Users,       color: 'text-slate-700',   bg: 'bg-white border-slate-200' },
          { label: 'Admins',      value: totalAdmin,      icon: ShieldCheck,  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'Consultores', value: totalVendedor,   icon: UserCheck,    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
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

      {/* TABELA */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-[9px] font-black uppercase tracking-wider">
                <th className="px-4 py-3 border-r border-blue-800">Usuário</th>
                <th className="px-4 py-3 border-r border-blue-800">E-mail</th>
                <th className="px-4 py-3 border-r border-blue-800 text-center">Perfil</th>
                <th className="px-4 py-3 border-r border-blue-800 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : filteredUsuarios.map((u, idx) => {
                const isMe = u.id === userLogado?.id;
                const ativo = u.ativo !== false;
                return (
                  <tr
                    key={u.id}
                    className={`text-[11px] border-b border-slate-100 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    } ${!ativo ? 'opacity-50' : ''} hover:bg-blue-50/30`}
                  >
                    {/* NOME */}
                    <td className="px-4 py-2.5 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#0A3D73] flex items-center justify-center text-white text-[10px] font-black shrink-0">
                          {u.nome?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{u.nome}</p>
                          {isMe && <p className="text-[8px] text-blue-600 font-black uppercase">← você</p>}
                        </div>
                      </div>
                    </td>
                    {/* EMAIL */}
                    <td className="px-4 py-2.5 border-r border-slate-100 text-slate-500 font-bold">
                      {u.email}
                    </td>
                    {/* PERFIL */}
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black border ${
                        u.role === 'admin'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {u.role === 'admin' ? '⚙ Admin' : '👤 Consultor'}
                      </span>
                    </td>
                    {/* STATUS */}
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black border ${
                        ativo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {ativo ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    {/* AÇÕES */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* Editar */}
                        <button
                          onClick={() => handleEdit(u)}
                          title="Editar"
                          className="w-7 h-7 flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-200"
                        >
                          <Edit size={12} />
                        </button>
                        {/* Reset senha */}
                        <button
                          onClick={() => { setSenhaUser(u); setSenhaDialogOpen(true); }}
                          title="Resetar senha"
                          className="w-7 h-7 flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors border border-transparent hover:border-amber-200"
                        >
                          <KeyRound size={12} />
                        </button>
                        {/* Ativar/Desativar */}
                        {!isMe && (
                          <button
                            onClick={() => handleToggleAtivo(u)}
                            title={ativo ? 'Desativar' : 'Reativar'}
                            className={`w-7 h-7 flex items-center justify-center transition-colors border border-transparent ${
                              ativo
                                ? 'hover:bg-red-50 text-slate-400 hover:text-red-500 hover:border-red-200'
                                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'
                            }`}
                          >
                            {ativo ? <UserX size={12} /> : <UserCheck size={12} />}
                          </button>
                        )}
                        {/* Excluir */}
                        {!isMe && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Excluir"
                            className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DIALOG CRIAR/EDITAR */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <Users size={15} />
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Identificação
              </p>
              <div className="space-y-3">
                <div>
                  <label className={sapLabel}>Nome Completo *</label>
                  <Input
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required className={sapInput} placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className={sapLabel}>E-mail *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required className={sapInput} placeholder="usuario@empresa.com"
                  />
                </div>
                <div>
                  <label className={sapLabel}>Perfil de Acesso *</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className={`${sapInput} cursor-pointer`}
                  >
                    <option value="vendedor">👤 Consultor</option>
                    <option value="admin">⚙ Administrador</option>
                  </select>
                </div>
              </div>
            </div>

            {!editingUser && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                  02 · Senha de Acesso
                </p>
                <div className="relative">
                  <label className={sapLabel}>Senha (mín. 6 caracteres) *</label>
                  <Input
                    type={showSenha ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required className={sapInput} placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    className="absolute right-3 top-6 text-slate-400 hover:text-slate-600"
                  >
                    {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-black uppercase h-10">
                {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESET SENHA */}
      <Dialog open={senhaDialogOpen} onOpenChange={(open) => { setSenhaDialogOpen(open); if (!open) setSenhaData(SENHA_INITIAL); }}>
        <DialogContent className="max-w-sm bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-amber-600 text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <KeyRound size={15} />
              Resetar Senha — {senhaUser?.nome}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetSenha} className="p-5 space-y-4">
            <div className="relative">
              <label className={sapLabel}>Nova Senha *</label>
              <Input
                type={showSenha ? 'text' : 'password'}
                value={senhaData.nova_senha}
                onChange={e => setSenhaData({ ...senhaData, nova_senha: e.target.value })}
                required className={sapInput} placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowSenha(s => !s)} className="absolute right-3 top-6 text-slate-400 hover:text-slate-600">
                {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <label className={sapLabel}>Confirmar Senha *</label>
              <Input
                type={showConfirmar ? 'text' : 'password'}
                value={senhaData.confirmar}
                onChange={e => setSenhaData({ ...senhaData, confirmar: e.target.value })}
                required className={sapInput} placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirmar(s => !s)} className="absolute right-3 top-6 text-slate-400 hover:text-slate-600">
                {showConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {senhaData.nova_senha && senhaData.confirmar && senhaData.nova_senha !== senhaData.confirmar && (
              <p className="text-[10px] text-red-600 font-bold">⚠ As senhas não coincidem</p>
            )}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setSenhaDialogOpen(false)} className="flex-1 rounded-none text-[10px] font-black uppercase h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-[10px] font-black uppercase h-10">
                Confirmar Reset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
