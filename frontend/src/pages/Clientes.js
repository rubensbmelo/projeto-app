import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, Lock } from 'lucide-react';
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
      setLoading(true);
      const response = await api.get('/clientes');
      // Garante que 'clientes' sempre seja um array, mesmo se vier vazio
      setClientes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error('Erro ao carregar base de clientes');
      setClientes([]); // Evita erro de .filter em caso de falha
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Acesso Negado');
      return;
    }

    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, formData);
        toast.success('Cadastro atualizado');
      } else {
        await api.post('/clientes', formData);
        toast.success('Cliente registrado com sucesso');
      }
      setDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error) { 
      console.error("Erro ao salvar:", error);
      toast.error('Erro na gravação dos dados'); 
    }
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

  // --- FILTRO BLINDADO CONTRA ERROS ---
  const filteredClientes = clientes.filter(cliente => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Verifica apenas os campos principais para evitar erros com valores nulos
    return (
      (cliente.nome?.toLowerCase() || "").includes(searchLower) ||
      (cliente.cnpj?.toLowerCase() || "").includes(searchLower) ||
      (cliente.cidade?.toLowerCase() || "").includes(searchLower)
    );
  });

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12 md:h-10 outline-none transition-all";

  if (loading) return <div className="p-8 text-center font-bold text-blue-800">CARREGANDO CLIENTES...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
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
                <DialogHeader className="p-6 bg-[#0A3D73] sticky top-0 z-10">
                    <DialogTitle className="text-white text-xs font-bold flex items-center gap-3 uppercase tracking-widest">
                        <Building2 size={18} /> {editingCliente ? 'Modificar Cliente' : 'Cadastro de Cliente'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-5">
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

      {/* BARRA DE BUSCA */}
      <Card className="mb-6 rounded-none border-none shadow-sm p-4 bg-white flex items-center gap-4">
        <Search className="text-slate-400" size={20} />
        <Input 
          placeholder="PESQUISAR POR NOME, CNPJ OU CIDADE..." 
          className="border-none shadow-none focus-visible:ring-0 text-xs font-medium uppercase tracking-wider"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* TABELA DE CLIENTES */}
      <Card className="rounded-none border-none shadow-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Cliente / Razão Social</th>
                <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Documento</th>
                <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest">Localização</th>
                <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm uppercase">{cliente.nome}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{cliente.email || 'SEM E-MAIL'}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">{cliente.cnpj}</td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-slate-700 uppercase">{cliente.cidade} - {cliente.estado}</div>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-slate-200 shadow-xl">
                          <DropdownMenuItem onClick={() => { setEditingCliente(cliente); setFormData(cliente); setDialogOpen(true); }} className="text-xs font-bold uppercase gap-2 cursor-pointer">
                            <Edit size={14} className="text-blue-600" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(cliente.id)} className="text-xs font-bold uppercase gap-2 text-red-600 cursor-pointer">
                            <Trash2 size={14} /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Clientes;