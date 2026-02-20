import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
      'CAIXA': 'bg-blue-100 text-blue-800',
      'CHAPA': 'bg-green-100 text-green-800',
      'CORTE VINCO': 'bg-purple-100 text-purple-800',
      'SIMPLEX': 'bg-orange-100 text-orange-800'
    };
    return classes[segmento] || 'bg-gray-100 text-gray-800';
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
            <Button data-testid="add-material-button" className="bg-slate-900 hover:bg-slate-800">
              <Plus size={16} className="mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Editar Material' : 'Novo Material'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    data-testid="input-codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    placeholder="Ex: MAT-001"
                  />
                </div>
                <div>
                  <Label htmlFor="segmento">Segmento</Label>
                  <Select
                    value={formData.segmento}
                    onValueChange={(value) => setFormData({ ...formData, segmento: value })}
                  >
                    <SelectTrigger data-testid="select-segmento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTOS.map(seg => (
                        <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  data-testid="input-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="peso_unitario">Peso Unitário (kg)</Label>
                  <Input
                    id="peso_unitario"
                    data-testid="input-peso"
                    type="number"
                    step="0.01"
                    value={formData.peso_unitario}
                    onChange={(e) => setFormData({ ...formData, peso_unitario: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preco_unitario">Preço Unitário (R$)</Label>
                  <Input
                    id="preco_unitario"
                    data-testid="input-preco"
                    type="number"
                    step="0.01"
                    value={formData.preco_unitario}
                    onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="porcentagem_comissao">Comissão (%)</Label>
                  <Input
                    id="porcentagem_comissao"
                    data-testid="input-comissao"
                    type="number"
                    step="0.01"
                    value={formData.porcentagem_comissao}
                    onChange={(e) => setFormData({ ...formData, porcentagem_comissao: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button data-testid="submit-material-button" type="submit" className="bg-slate-900 hover:bg-slate-800">
                  {editingMaterial ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            data-testid="search-materiais"
            placeholder="Buscar por código, descrição ou segmento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="materiais-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Segmento</th>
                <th className="text-right">Peso Unit. (kg)</th>
                <th className="text-right">Preço Unit.</th>
                <th className="text-right">Comissão (%)</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : filteredMateriais.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    Nenhum material encontrado
                  </td>
                </tr>
              ) : (
                filteredMateriais.map((material) => (
                  <tr key={material.id} data-testid={`material-row-${material.id}`}>
                    <td className="font-mono font-medium text-slate-900">{material.codigo}</td>
                    <td className="font-medium">{material.descricao}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSegmentoBadgeClass(material.segmento)}`}>
                        {material.segmento}
                      </span>
                    </td>
                    <td className="text-right font-mono">{material.peso_unitario.toFixed(2)}</td>
                    <td className="text-right font-mono">R$ {material.preco_unitario.toFixed(2)}</td>
                    <td className="text-right font-mono font-medium text-green-700">{material.porcentagem_comissao}%</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          data-testid={`edit-material-${material.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          data-testid={`delete-material-${material.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
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

export default Materiais;
