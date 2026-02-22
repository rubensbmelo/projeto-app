import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2, User, MapPin, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Clientes = () => {
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
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar lista de clientes');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await axios.put(`${API}/clientes/${editingCliente.id}`, formData);
        toast.success('Cadastro atualizado!');
      } else {
        await axios.post(`${API}/clientes`, formData);
        toast.success('Cliente cadastrado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error) { toast.error('Erro ao salvar dados'); }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({ ...cliente });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este cliente permanentemente?')) {
      try {
        await axios.delete(`${API}/clientes/${id}`);
        toast.success('Cliente removido');
        fetchClientes();
      } catch (error) { toast.error('Erro ao deletar'); }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', cnpj: '', endereco: '', cidade: '', estado: '', comprador: '', telefone: '', email: '' });
    setEditingCliente(null);
  };

  const filteredClientes = clientes.filter(cliente =>
    Object.values(cliente).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Base de Clientes</h1>
          <p className="text-slate-500 font-medium">Gerenciamento de parceiros e contatos comerciais</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
              <Plus size={18} className="mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border-none shadow-2xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                {editingCliente ? 'Atualizar Cliente' : 'Cadastrar Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">Razão Social / Nome</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required className="focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">CNPJ / CPF</Label>
                  <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} required placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">Responsável (Comprador)</Label>
                  <Input value={formData.comprador} onChange={(e) => setFormData({ ...formData, comprador: e.target.value })} placeholder="Nome do contato principal" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">Endereço Completo</Label>
                  <Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">Cidade</Label>
                  <Input value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase">UF</Label>
                  <Input value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase text-indigo-600">E-mail Comercial</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase text-indigo-600">Telefone / WhatsApp</Label>
                  <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Descartar</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-8">Salvar Cadastro</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <Input 
          placeholder="Pesquisar por nome, CNPJ, cidade ou comprador..." 
          className="pl-12 h-12 bg-white border-none shadow-sm focus:ring-2 focus:ring-indigo-500 text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 text-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Ref / Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Documento</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Localização</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Contato</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-500 font-mono mb-0.5">{cliente.referencia}</span>
                      <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{cliente.nome}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1"><User size={12} /> {cliente.comprador || 'Sem responsável'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{cliente.cnpj}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} className="text-slate-300" />
                      <span className="text-sm">{cliente.cidade} - {cliente.estado}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {cliente.email && <span className="text-xs text-slate-600 flex items-center gap-1.5"><Mail size={12} className="text-indigo-400" /> {cliente.email}</span>}
                      {cliente.telefone && <span className="text-xs text-slate-600 flex items-center gap-1.5"><Phone size={12} className="text-indigo-400" /> {cliente.telefone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-white">
                        <DropdownMenuItem onClick={() => handleEdit(cliente)} className="cursor-pointer gap-2">
                          <Edit size={14} /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(cliente.id)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 size={14} /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {loading && <div className="text-center py-20 text-slate-400 animate-pulse">Carregando mestre de clientes...</div>}
    </div>
  );
};

export default Clientes;