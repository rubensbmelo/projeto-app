import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEGMENTOS = ['CAIXA', 'CHAPA', 'CORTE VINCO', 'SIMPLEX'];

const Materiais = () => {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    segmento: 'CAIXA',
    peso_unitario: '',
    porcentagem_comissao: '',
    preco_unitario: ''
  });

  useEffect(() => {
    fetchMateriais();
  }, []);

  const fetchMateriais = async () => {
    try {
      const response = await axios.get(`${API}/materiais`);
      setMateriais(response.data);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        peso_unitario: parseFloat(formData.peso_unitario),
        porcentagem_comissao: parseFloat(formData.porcentagem_comissao),
        preco_unitario: parseFloat(formData.preco_unitario)
      };

      if (editingMaterial) {
        await axios.put(`${API}/materiais/${editingMaterial.id}`, data);
        toast.success('Material atualizado com sucesso!');
      } else {
        await axios.post(`${API}/materiais`, data);
        toast.success('Material criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error('Erro ao salvar material');
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      codigo: material.codigo,
      descricao: material.descricao,
      segmento: material.segmento,
      peso_unitario: material.peso_unitario.toString(),
      porcentagem_comissao: material.porcentagem_comissao.toString(),
      preco_unitario: material.preco_unitario.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este material?')) {
      try {
        await axios.delete(`${API}/materiais/${id}`);
        toast.success('Material deletado com sucesso!');
        fetchMateriais();
      } catch (error) {
        console.error('Erro ao deletar material:', error);
        toast.error('Erro ao deletar material');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descricao: '',
      segmento: 'CAIXA',
      peso_unitario: '',
      porcentagem_comissao: '',
      preco_unitario: ''
    });
    setEditingMaterial(null);
  };

  const filteredMateriais = materiais.filter(material =>
    material.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.segmento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSegmentoBadgeClass = (segmento) => {
    const classes = {
      'CAIXA': 'bg-slate-100 text-slate-700 border-slate-300',
      'CHAPA': 'bg-blue-100 text-blue-700 border-blue-300',
      'CORTE VINCO': 'bg-slate-100 text-slate-700 border-slate-300',
      'SIMPLEX': 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return classes[segmento] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
            Materiais
          </h1>
          <p className="text-slate-600 mt-1">Mestre de produtos e materiais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-material-button" className="bg-slate-900 hover:bg-slate-800 text-white">
              <Plus size={16} className="mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ color: '#0F172A', fontFamily: 'Karla, sans-serif' }}>
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo" className="text-slate-700 font-medium">FE (Código)</Label>
                  <Input
                    id="codigo"
                    data-testid="input-codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="Ex: MAT-001"
                    className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="segmento" className="text-slate-700 font-medium">Segmento</Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(value) => setFormData({ ...formData, segmento: value })}
                  >
                    <SelectTrigger data-testid="select-segmento" className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {SEGMENTOS.map(seg => (
                        <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descricao" className="text-slate-700 font-medium">Descrição</Label>
                <Input
                  id="descricao"
                  data-testid="input-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="peso_unitario" className="text-slate-700 font-medium">Peso Unitário (kg)</Label>
                  <Input
                    id="peso_unitario"
                    data-testid="input-peso"
                    type="number"
                    step="0.01"
                    value={formData.peso_unitario}
                    onChange={(e) => setFormData({ ...formData, peso_unitario: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="preco_unitario" className="text-slate-700 font-medium">Preço Unitário (R$)</Label>
                  <Input
                    id="preco_unitario"
                    data-testid="input-preco"
                    type="number"
                    step="0.01"
                    value={formData.preco_unitario}
                    onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <Label htmlFor="porcentagem_comissao" className="text-slate-700 font-medium">Comissão (%)</Label>
                  <Input
                    id="porcentagem_comissao"
                    data-testid="input-comissao"
                    type="number"
                    step="0.01"
                    value={formData.porcentagem_comissao}
                    onChange={(e) => setFormData({ ...formData, porcentagem_comissao: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-300">
                  Cancelar
                </Button>
                <Button data-testid="submit-material-button" type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                  {editingMaterial ? 'Atualizar' : 'Criar'}
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
            data-testid="search-materiais"
            placeholder="Buscar por FE, descrição ou segmento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 focus:border-blue-600 focus:ring-blue-600"
          />
        </div>
      </Card>

      {/* Table com Efeito Zebra */}
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="materiais-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">FE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Segmento</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Peso Unit. (kg)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Preço Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Comissão (%)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredMateriais.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 bg-white">
                    Nenhum material encontrado
                  </td>
                </tr>
              ) : (
                filteredMateriais.map((material, index) => (
                  <tr 
                    key={material.id} 
                    data-testid={`material-row-${material.id}`}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-sm">{material.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-sm">{material.descricao}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSegmentoBadgeClass(material.segmento)}`}>
                        {material.segmento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 text-sm">{material.peso_unitario.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 text-sm">R$ {material.preco_unitario.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-green-700 text-sm">{material.porcentagem_comissao}%</td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            data-testid={`menu-material-${material.id}`}
                          >
                            <MoreVertical size={16} className="text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => handleEdit(material)}
                            data-testid={`edit-material-${material.id}`}
                            className="cursor-pointer hover:bg-slate-50"
                          >
                            <Edit size={14} className="mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(material.id)}
                            data-testid={`delete-material-${material.id}`}
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

export default Materiais;
