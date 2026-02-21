import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
        toast.success('Cliente criado com sucesso!');
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
    cliente.cnpj.includes(searchTerm)
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="referencia">Referência</Label>
                  <Input
                    id="referencia"
                    data-testid="input-referencia"
                    value={formData.referencia}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    required
                    placeholder="Ex: IANE, SAO BRAZ"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    data-testid="input-cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    required
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nome">Nome / Razão Social</Label>
                <Input
                  id="nome"
                  data-testid="input-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  data-testid="input-endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    data-testid="input-cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    data-testid="input-estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    data-testid="input-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@email.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            data-testid="search-clientes"
            placeholder="Buscar por nome, referência ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="clientes-table">
            <thead>
              <tr>
                <th>Referência</th>
                <th>Nome / Razão Social</th>
                <th>CNPJ</th>
                <th>Cidade/Estado</th>
                <th>Contato</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} data-testid={`cliente-row-${cliente.id}`}>
                    <td className="font-mono font-medium text-slate-900">{cliente.referencia}</td>
                    <td className="font-medium">{cliente.nome}</td>
                    <td className="font-mono text-slate-600">{cliente.cnpj}</td>
                    <td className="text-slate-600">{cliente.cidade} - {cliente.estado}</td>
                    <td className="text-slate-600 text-xs">
                      {cliente.telefone && <div>{cliente.telefone}</div>}
                      {cliente.email && <div>{cliente.email}</div>}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          data-testid={`edit-cliente-${cliente.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          data-testid={`delete-cliente-${cliente.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
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