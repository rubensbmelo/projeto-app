import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    comprador: '',
    telefone: '',
    email: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await axios.put(`${API}/clientes/${editingCliente.id}`, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await axios.post(`${API}/clientes`, formData);
        toast.success('Cliente criado com sucesso! Referência gerada automaticamente.');
      }
      setDialogOpen(false);
      resetForm();
      fetchClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      cnpj: cliente.cnpj,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      estado: cliente.estado,
      comprador: cliente.comprador || '',
      telefone: cliente.telefone || '',
      email: cliente.email || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await axios.delete(`${API}/clientes/${id}`);
        toast.success('Cliente deletado com sucesso!');
        fetchClientes();
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        toast.error('Erro ao deletar cliente');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      estado: '',
      comprador: '',
      telefone: '',
      email: ''
    });
    setEditingCliente(null);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj.includes(searchTerm) ||
    (cliente.comprador && cliente.comprador.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
            Clientes
          </h1>
          <p className="text-slate-600 mt-1">Mestre de clientes cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-cliente-button" className="bg-slate-900 hover:bg-slate-800">
              <Plus size={16} className="mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ color: '#0f172a', fontFamily: 'Karla, sans-serif' }}>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              {!editingCliente && (
                <p className="text-sm text-slate-500 mt-2">A referência será gerada automaticamente (CLI-0001, CLI-0002...)</p>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome" className="text-slate-700 font-medium">Nome / Razão Social</Label>
                  <Input
                    id="nome"
                    data-testid="input-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj" className="text-slate-700 font-medium">CNPJ</Label>
                  <Input
                    id="cnpj"
                    data-testid="input-cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    required
                    placeholder="00.000.000/0000-00"
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="comprador" className="text-slate-700 font-medium">Comprador (Responsável)</Label>
                <Input
                  id="comprador"
                  data-testid="input-comprador"
                  value={formData.comprador}
                  onChange={(e) => setFormData({ ...formData, comprador: e.target.value })}
                  required
                  placeholder="Nome do responsável pelas compras"
                  className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>
              <div>
                <Label htmlFor="endereco" className="text-slate-700 font-medium">Endereço</Label>
                <Input
                  id="endereco"
                  data-testid="input-endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                  className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade" className="text-slate-700 font-medium">Cidade</Label>
                  <Input
                    id="cidade"
                    data-testid="input-cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-slate-700 font-medium">Estado</Label>
                  <Input
                    id="estado"
                    data-testid="input-estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                    placeholder="Ex: SP"
                    maxLength={2}
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-slate-700 font-medium">E-mail</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@email.com"
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone" className="text-slate-700 font-medium">Telefone</Label>
                  <Input
                    id="telefone"
                    data-testid="input-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="mt-1 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-300">
                  Cancelar
                </Button>
                <Button data-testid="submit-cliente-button" type="submit" className="bg-slate-900 hover:bg-slate-800">
                  {editingCliente ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar - Fundo Branco */}
      <Card className="p-4 mb-6 bg-white border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            data-testid="search-clientes"
            placeholder="Buscar por nome, referência, CNPJ ou comprador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 focus:border-slate-900 focus:ring-slate-900"
          />
        </div>
      </Card>

      {/* Table com Efeito Zebra */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="clientes-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Referência</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome / Razão Social</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cidade/Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Comprador</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente, index) => (
                  <tr 
                    key={cliente.id} 
                    data-testid={`cliente-row-${cliente.id}`}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-sm">{cliente.referencia}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-sm">{cliente.nome}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">{cliente.cnpj}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{cliente.cidade} - {cliente.estado}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium text-sm">{cliente.comprador || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{cliente.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm font-mono">{cliente.telefone || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            data-testid={`menu-cliente-${cliente.id}`}
                          >
                            <MoreVertical size={16} className="text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => handleEdit(cliente)}
                            data-testid={`edit-cliente-${cliente.id}`}
                            className="cursor-pointer hover:bg-slate-50"
                          >
                            <Edit size={14} className="mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(cliente.id)}
                            data-testid={`delete-cliente-${cliente.id}`}
                            className="cursor-pointer text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Clientes;
