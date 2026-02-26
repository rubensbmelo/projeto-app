import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, MoreVertical, Package, Scale, DollarSign, Percent, Lock, Calculator } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const SEGMENTOS = ['CAIXA', 'CHAPA', 'CORTE VINCO', 'SIMPLEX'];

const Materiais = () => {
  const { isAdmin } = useAuth();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    codigo: '', descricao: '', segmento: 'CAIXA', peso_unit: '', comissao: '', preco_unit: ''
  });

  useEffect(() => { fetchMateriais(); }, []);

  const fetchMateriais = async () => {
    try {
      const response = await api.get('/materiais');
      setMateriais(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Erro ao carregar catálogo');
    } finally { setLoading(false); }
  };

  // Limpa o formato brasileiro (7.560,00) para número puro (7560.00)
  const limparParaNumero = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0;
    // Remove pontos de milhar e troca vírgula decimal por ponto
    const limpo = String(valor).replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

  // Formata números para o padrão brasileiro: 7.560,00
  const formatarMoedaBR = (valor) => {
    if (valor === undefined || valor === null) return "0,00";
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const calcularFatorForm = () => {
    const peso = limparParaNumero(formData.peso_unit);
    const precoMilheiro = limparParaNumero(formData.preco_unit);
    
    // Fator = Preço Milheiro / (Peso Unitário * 1000)
    if (peso > 0) {
      const fator = precoMilheiro / (peso * 1000);
      return formatarMoedaBR(fator);
    }
    return "0,00";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Ação não permitida');

    try {
      const data = {
        nome: formData.descricao,
        codigo: formData.codigo,
        descricao: formData.descricao,
        segmento: formData.segmento,
        peso_unit: limparParaNumero(formData.peso_unit),
        comissao: limparParaNumero(formData.comissao),
        preco_unit: limparParaNumero(formData.preco_unit)
      };

      if (editingMaterial) {
        await api.put(`/materiais/${editingMaterial.id}`, data);
        toast.success('Material atualizado');
      } else {
        await api.post('/materiais', data);
        toast.success('Material cadastrado');
      }
      setDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch (error) {
      toast.error('Erro ao salvar. Verifique os valores.');
    }
  };

  const handleEdit = (material) => {
    if (!isAdmin) return; 
    setEditingMaterial(material);
    // Ao editar, convertemos os pontos do banco para vírgulas para o usuário
    setFormData({
      codigo: material.codigo || '',
      descricao: material.nome || material.descricao || '',
      segmento: material.segmento || 'CAIXA',
      peso_unit: String(material.peso_unit || '').replace('.', ','),
      comissao: String(material.comissao || '').replace('.', ','),
      preco_unit: String(material.preco_unit || '').replace('.', ',')
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este material?')) {
      try {
        await api.delete(`/materiais/${id}`);
        toast.success('Removido');
        fetchMateriais();
      } catch (error) {
        toast.error('Erro ao deletar');
      }
    }
  };

  const resetForm = () => {
    setFormData({ codigo: '', descricao: '', segmento: 'CAIXA', peso_unit: '', comissao: '', preco_unit: '' });
    setEditingMaterial(null);
  };

  const filteredMateriais = materiais.filter(m =>
    (m.nome?.toLowerCase() || m.descricao?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.codigo?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-12 md:h-10 outline-none transition-all";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Produtos {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase py-6">
                <Plus size={16} className="mr-2" /> Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-none p-0">
              <DialogHeader className="p-6 bg-[#0A3D73] text-white">
                <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <Package size={16}/> {editingMaterial ? 'Modificar Material' : 'Novo Registro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Código</Label>
                      <Input value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} required className={sapInput} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Descrição Técnica</Label>
                      <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required className={sapInput} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:col-span-2 gap-4 p-5 bg-slate-50 border border-slate-200">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[9px] uppercase">Peso Unit (KG)</Label>
                        <Input value={formData.peso_unit} onChange={(e) => setFormData({ ...formData, peso_unit: e.target.value })} className={sapInput} placeholder="0,00" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-amber-600 font-bold text-[9px] uppercase">Preço Milheiro</Label>
                        <Input value={formData.preco_unit} onChange={(e) => setFormData({ ...formData, preco_unit: e.target.value })} className={sapInput} placeholder="7.560,00" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-green-700 font-bold text-[9px] uppercase">Comissão %</Label>
                        <Input value={formData.comissao} onChange={(e) => setFormData({ ...formData, comissao: e.target.value })} className={sapInput} placeholder="0,00" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-blue-700 font-bold text-[9px] uppercase">Fator R$/KG</Label>
                        <div className="h-10 flex items-center px-3 bg-blue-50 border border-blue-200 font-bold text-xs text-blue-800">
                          R$ {calcularFatorForm()}
                        </div>
                      </div>
                    </div>
                  </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none uppercase text-[10px] font-bold">Descartar</Button>
                  <Button type="submit" className="bg-[#0A3D73] text-white px-10 rounded-none text-[10px] font-bold uppercase">Gravar Registro</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative mb-6 bg-white border border-slate-300 p-1 flex items-center">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input 
          placeholder="Buscar material..." 
          className="border-none focus:ring-0 text-sm bg-transparent w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A3D73] text-white text-[10px] font-bold uppercase text-left">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4 text-right">Peso Unit.</th>
                <th className="px-6 py-4 text-right">Preço Milheiro</th>
                <th className="px-6 py-4 text-right bg-blue-800/50">Fator R$/KG</th>
                <th className="px-6 py-4 text-right">Comissão</th>
                {isAdmin && <th className="px-6 py-4"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMateriais.map((m) => {
                const p = m.peso_unit || 0;
                const pr = m.preco_unit || 0;
                const fator = p > 0 ? (pr / (p * 1000)) : 0;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-blue-900">{m.codigo}</td>
                    <td className="px-6 py-4 font-bold text-[13px] uppercase">
                      {m.nome || m.descricao}
                      <div className="text-[9px] text-slate-400 font-normal">{m.segmento}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">{formatarMoedaBR(m.peso_unit)} kg</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">R$ {formatarMoedaBR(m.preco_unit)}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-700 bg-blue-50/30">R$ {formatarMoedaBR(fator)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-700">{formatarMoedaBR(m.comissao)}%</td>
                    
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white rounded-none border-slate-300">
                            <DropdownMenuItem onClick={() => handleEdit(m)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer">
                              <Edit size={14} /> Alterar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer text-red-600">
                              <Trash2 size={14} /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Materiais;