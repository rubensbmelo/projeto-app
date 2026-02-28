import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, Lock, Users, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

const FORM_INITIAL = {
  nome: '', cnpj: '', endereco: '', cidade: '', estado: '',
  comprador: '', telefone: '', email: ''
};

const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold uppercase px-3 w-full outline-none transition-all";
const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

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
      const response = await api.get('/clientes');
      setClientes(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error('Erro ao carregar base de clientes');
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
      setDialogOpen(false);
      resetForm();
      fetchClientes();
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

  const resetForm = () => {
    setFormData(FORM_INITIAL);
    setEditingCliente(null);
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome || '',
      cnpj: cliente.cnpj || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      comprador: cliente.comprador || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
    });
    setDialogOpen(true);
  };

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(s) ||
      c.cnpj?.toLowerCase().includes(s) ||
      c.cidade?.toLowerCase().includes(s) ||
      c.comprador?.toLowerCase().includes(s)
    );
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Clientes...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Clientes</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Gestão de Carteira · {filteredClientes.length} registros
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Busca */}
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="Nome, CNPJ, cidade..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-48"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin ? (
            <Button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
            >
              <Plus size={14} className="mr-1.5" /> Novo Cliente
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-200 px-3 py-2 text-slate-500 text-[9px] font-black uppercase border border-slate-300">
              <Lock size={12} /> Modo Visualização
            </div>
          )}
        </div>
      </div>

      {/* TOTALIZADOR */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total de Clientes', value: clientes.length, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Resultado da Busca', value: filteredClientes.length, icon: Search, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Estados Atendidos', value: [...new Set(clientes.map(c => c.estado).filter(Boolean))].length, icon: MapPin, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
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
                <th className="px-4 py-3 border-r border-blue-800">Razão Social</th>
                <th className="px-4 py-3 border-r border-blue-800">CNPJ</th>
                <th className="px-4 py-3 border-r border-blue-800">Comprador</th>
                <th className="px-4 py-3 border-r border-blue-800">Localização</th>
                <th className="px-4 py-3 border-r border-blue-800">Contato</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : filteredClientes.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`text-[11px] border-b border-slate-100 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                  } hover:bg-blue-50 cursor-pointer`}
                  onClick={() => isAdmin && handleEdit(c)}
                >
                  {/* RAZÃO SOCIAL */}
                  <td className="px-4 py-2.5 border-r border-slate-100">
                    <p className="font-black text-slate-900 uppercase">{c.nome}</p>
                    {c.email && (
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                        <Mail size={9} /> {c.email}
                      </p>
                    )}
                  </td>
                  {/* CNPJ */}
                  <td className="px-4 py-2.5 border-r border-slate-100 font-mono font-bold text-slate-600 whitespace-nowrap">
                    {c.cnpj || '---'}
                  </td>
                  {/* COMPRADOR */}
                  <td className="px-4 py-2.5 border-r border-slate-100 font-bold uppercase whitespace-nowrap">
                    {c.comprador || <span className="text-slate-300 italic text-[10px]">— não informado —</span>}
                  </td>
                  {/* LOCALIZAÇÃO */}
                  <td className="px-4 py-2.5 border-r border-slate-100 whitespace-nowrap">
                    <p className="font-bold uppercase text-slate-700">{c.cidade || '---'}{c.estado ? ` — ${c.estado}` : ''}</p>
                    {c.endereco && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{c.endereco}</p>}
                  </td>
                  {/* CONTATO */}
                  <td className="px-4 py-2.5 border-r border-slate-100 whitespace-nowrap">
                    {c.telefone ? (
                      <p className="font-bold text-slate-700 flex items-center gap-1">
                        <Phone size={10} className="text-slate-400" /> {c.telefone}
                      </p>
                    ) : <span className="text-slate-300 italic text-[10px]">— não informado —</span>}
                  </td>
                  {/* AÇÕES */}
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-slate-200 shadow-xl bg-white">
                          <DropdownMenuItem onClick={() => handleEdit(c)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer p-3">
                            <Edit size={13} className="text-blue-600" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer text-red-600 p-3">
                            <Trash2 size={13} /> Excluir
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
      </Card>

      {/* DIALOG FORMULÁRIO */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <Building2 size={15} />
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* BLOCO 1 — IDENTIFICAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Identificação
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={sapLabel}>Razão Social *</label>
                  <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value.toUpperCase() })} required className={sapInput} />
                </div>
                <div>
                  <label className={sapLabel}>CNPJ / Documento *</label>
                  <Input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} required className={sapInput} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className={sapLabel}>Comprador / Contato</label>
                  <Input value={formData.comprador} onChange={e => setFormData({ ...formData, comprador: e.target.value.toUpperCase() })} className={sapInput} />
                </div>
              </div>
            </div>

            {/* BLOCO 2 — LOCALIZAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                02 · Localização
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3">
                <div className="md:col-span-2">
                  <label className={sapLabel}>Endereço</label>
                  <Input value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} className={sapInput} />
                </div>
                <div className="md:col-span-1">
                  <label className={sapLabel}>Cidade</label>
                  <Input value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value.toUpperCase() })} className={sapInput} />
                </div>
                <div className="md:col-span-1">
                  <label className={sapLabel}>UF</label>
                  <Input value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} maxLength={2} className={sapInput} placeholder="PE" />
                </div>
              </div>
            </div>

            {/* BLOCO 3 — CONTATO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                03 · Contato
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={sapLabel}>E-mail Corporativo</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={sapInput} placeholder="contato@empresa.com.br" />
                </div>
                <div>
                  <label className={sapLabel}>Telefone / WhatsApp</label>
                  <Input value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className={sapInput} placeholder="(81) 99999-9999" />
                </div>
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col md:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-black uppercase h-10 tracking-widest">
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