import React, { useState, useEffect } from 'react';
// IMPORTANTE: Trocamos o axios pelo nosso serviço configurado
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, User, MapPin, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Clientes = () => {
  const { isAdmin } = useAuth(); 
  
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '', cnpj: '', endereco: '', cidade: '', estado: '', comprador: '', telefone: '', email: ''
  });

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    try {
      // Agora usamos api.get e ele já sabe o endereço correto (local ou nuvem)
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar base de clientes');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Acesso Negado: Você não tem permissão para alterar dados.');
      return;
    }

    try {
      if (editingCliente) {
        // api.put em vez de axios.put
        await api.put(`/clientes/${editingCliente.id}`, formData);
        toast.success('Cadastro atualizado');
      } else {
        // api.post em vez de axios.post
        await api.post('/clientes', formData);
        toast.success('Cliente registrado com sucesso');
      }
      setDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error) { toast.error('Erro na gravação dos dados'); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este cliente permanentemente?')) {
      try {
        await api.delete(`/clientes/${id}`);
        toast.success('Registro removido');
        fetchClientes();
      } catch (error) { toast.error('Erro ao deletar'); }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', cnpj: '', endereco: '', cidade: '', estado: '', comprador: '', telefone: '', email: '' });
    setEditingCliente(null);
  };

  // ... (O restante do código de renderização/JSX permanece EXATAMENTE igual)
  
  const filteredClientes = clientes.filter(cliente =>
    Object.values(cliente).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12 md:h-10 outline-none transition-all";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      {/* Todo o seu JSX que já estava perfeito continua aqui embaixo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight uppercase">Clientes</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Carteira e Contatos</p>
        </div>
        
        {isAdmin ? (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-8 font-bold text-[10px] uppercase tracking-widest py-6 md:py-2 shadow-md border-b-2 border-[#051C36]">
                <Plus size={16} className="mr-2" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full md:max-w-2xl bg-white border-none shadow-2xl rounded-none p-0 overflow-y-auto max-h-[95vh]">
                {/* ... conteúdo do form igual ao seu ... */}
                <DialogHeader className="p-6 bg-[#0A3D73] sticky top-0 z-10">
                    <DialogTitle className="text-white text-xs font-bold flex items-center gap-3 uppercase tracking-widest">
                        <Building2 size={18} /> {editingCliente ? 'Modificar Cliente' : 'Cadastro de Cliente'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-5">
                    {/* (Seus inputs de form aqui) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Razão Social</Label>
                            <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required className={sapInput} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">CNPJ / Documento</Label>
                            <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} required className={sapInput} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Comprador (Contato)</Label>
                            <Input value={formData.comprador} onChange={(e) => setFormData({ ...formData, comprador: e.target.value })} className={sapInput} />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-200">
                            <div className="col-span-4 md:col-span-2 space-y-1.5">
                                <Label className="text-slate-500 font-bold text-[9px] uppercase">Endereço</Label>
                                <Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className={sapInput} />
                            </div>
                            <div className="col-span-3 md:col-span-1 space-y-1.5">
                                <Label className="text-slate-500 font-bold text-[9px] uppercase">Cidade</Label>
                                <Input value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className={sapInput} />
                            </div>
                            <div className="col-span-1 md:col-span-1 space-y-1.5">
                                <Label className="text-slate-500 font-bold text-[9px] uppercase">UF</Label>
                                <Input value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} maxLength={2} className={sapInput} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">E-mail Corporativo</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={sapInput} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Telefone / WhatsApp</Label>
                            <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} className={sapInput} />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="submit" className="w-full md:w-auto bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-bold uppercase py-6 md:py-2 order-1 md:order-2">
                            Salvar Cliente
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full md:w-auto rounded-none py-6 md:py-2 order-2 md:order-1">
                            Fechar
                        </Button>
                    </div>
                </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex items-center gap-2 bg-slate-200 px-4 py-2 text-slate-500 text-[9px] font-bold uppercase border border-slate-300">
            <Lock size={14} /> Modo Visualização
          </div>
        )}
      </div>

      {/* ... Resto do componente igual ... */}
      {/* Busca, Tabela, View Mobile seguem a mesma lógica */}
    </div>
  );
};

export default Clientes;