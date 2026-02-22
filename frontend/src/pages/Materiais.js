import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, MoreVertical, Package, Calculator, Tag } from 'lucide-react';
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
    codigo: '', descricao: '', segmento: 'CAIXA', peso_unitario: '', porcentagem_comissao: '', preco_unitario: ''
  });

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    try {
      const response = await axios.get(`${API}/materiais`);
      setMateriais(response.data);
    } catch (error) {
      toast.error('Erro ao carregar catálogo de materiais');
    } finally { setLoading(false); }
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
        toast.success('Material atualizado!');
      } else {
        await axios.post(`${API}/materiais`, data);
        toast.success('Novo material cadastrado!');
      }
      setDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch (error) {
      toast.error('Erro ao processar solicitação');
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
    if (window.confirm('Excluir este material permanentemente?')) {
      try {
        await axios.delete(`${API}/materiais/${id}`);
        toast.success('Material removido');
        fetchMateriais();
      } catch (error) {
        toast.error('Erro ao deletar');
      }
    }
  };

  const resetForm = () => {
    setFormData({ codigo: '', descricao: '', segmento: 'CAIXA', peso_unitario: '', porcentagem_comissao: '', preco_unitario: '' });
    setEditingMaterial(null);
  };

  const filteredMateriais = materiais.filter(material =>
    material.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSegmentoStyle = (segmento) => {
    const styles = {
      'CAIXA': 'bg-slate-100 text-slate-700 border-slate-200',
      'CHAPA': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'CORTE VINCO': 'bg-amber-50 text-amber-700 border-amber-200',
      'SIMPLEX': 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return styles[segmento] || styles['CAIXA'];
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catálogo de Materiais</h1>
          <p className="text-slate-500 mt-1">Gerencie produtos, pesos e tabelas de comissão</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all">
              <Plus size={18} className="mr-2" /> Cadastrar Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border-none shadow-2xl">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">FE (Código)</Label>
                  <Input 
                    value={formData.codigo} 
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="h-11 focus:ring-2 focus:ring-indigo-600" 
                    placeholder="Ex: FE-9901" required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Segmento</Label>
                  <Select value={formData.segmento} onValueChange={(v) => setFormData({ ...formData, segmento: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {SEGMENTOS.map(seg => <SelectItem key={seg} value={seg}>{seg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Descrição Completa</Label>
                <Input 
                  value={formData.descricao} 
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="h-11" placeholder="Ex: Chapa de papelão ondulado BC..." required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Peso Unit. (kg)</Label>
                  <Input type="number" step="0.001" value={formData.peso_unitario} onChange={(e) => setFormData({ ...formData, peso_unitario: e.target.value })} className="bg-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Preço Unit. (R$)</Label>
                  <Input type="number" step="0.01" value={formData.preco_unitario} onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })} className="bg-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Comissão (%)</Label>
                  <Input type="number" step="0.1" value={formData.porcentagem_comissao} onChange={(e) => setFormData({ ...formData, porcentagem_comissao: e.target.value })} className="bg-white" required />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Descartar</Button>
                <Button type="submit" className="bg-slate-900 text-white px-8">Salvar Material</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-2 mb-6 bg-white border-none shadow-sm flex items-center">
        <Search className="ml-3 text-slate-400" size={20} />
        <Input
          placeholder="Busque por código ou descrição do material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none focus-visible:ring-0 text-slate-600 placeholder:text-slate-400"
        />
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Cód. FE</th>
                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Descrição do Item</th>
                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-widest text-[10px]">Segmento</th>
                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-widest text-[10px]">Peso Unit.</th>
                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-widest text-[10px]">Vlr. Unitário</th>
                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-widest text-[10px]">Comissão</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-400 animate-pulse">Carregando catálogo...</td></tr>
              ) : filteredMateriais.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <Package size={48} className="mb-2 opacity-20" />
                      <p>Nenhum material encontrado com este termo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMateriais.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{m.codigo}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{m.descricao}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black border ${getSegmentoStyle(m.segmento)}`}>
                        {m.segmento}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">{m.peso_unitario.toFixed(3)}kg</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">R$ {m.preco_unitario.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{m.porcentagem_comissao}%</td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => handleEdit(m)} className="cursor-pointer">
                            <Edit size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(m.id)} className="cursor-pointer text-red-600 focus:text-red-600">
                            <Trash2 size={14} className="mr-2" /> Excluir
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