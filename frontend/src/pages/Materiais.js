import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, MoreVertical, Package, Scale, DollarSign, Percent, Lock } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Ação não permitida');
      return;
    }

    // FUNÇÃO QUE LIMPA VÍRGULA E TRANSFORMA EM NÚMERO
    const parseMoeda = (valor) => {
      if (!valor) return 0;
      const limpo = String(valor).replace(',', '.');
      return parseFloat(limpo) || 0;
    };

    try {
      // Sincronizando nomes com o Backend (main.py)
      const payload = {
        nome: formData.descricao, // O Python usa 'nome' como campo obrigatório
        codigo: formData.codigo,
        descricao: formData.descricao,
        segmento: formData.segmento,
        peso_unit: parseMoeda(formData.peso_unit),
        comissao: parseMoeda(formData.comissao),
        preco_unit: parseMoeda(formData.preco_unit)
      };

      if (editingMaterial) {
        await api.put(`/materiais/${editingMaterial.id}`, payload);
        toast.success('Material atualizado');
      } else {
        await api.post('/materiais', payload);
        toast.success('Material cadastrado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchMateriais();
    } catch (error) {
      console.error("Erro detalhado:", error.response?.data);
      toast.error('Erro na transação: Verifique os valores');
    }
  };

  const handleEdit = (material) => {
    if (!isAdmin) return; 
    setEditingMaterial(material);
    setFormData({
      codigo: material.codigo || '',
      descricao: material.descricao || material.nome || '',
      segmento: material.segmento || 'CAIXA',
      peso_unit: material.peso_unit?.toString() || '',
      comissao: material.comissao?.toString() || '',
      preco_unit: material.preco_unit?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir este material permanentemente?')) {
      try {
        await api.delete(`/materiais/${id}`);
        toast.success('Registro removido');
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
    (m.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.codigo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.descricao?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-12 md:h-10 outline-none transition-all";
  const sapSelectTrigger = "bg-white border-slate-300 focus:ring-0 focus:border-blue-800 rounded-none h-12 md:h-10 outline-none w-full flex items-center justify-between px-3 text-slate-700 font-medium";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Produtos {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Gestão de Itens e Precificação
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-8 font-bold text-[10px] uppercase tracking-widest py-6 md:py-2 shadow-md border-b-2 border-[#051C36]">
                <Plus size={16} className="mr-2" /> Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full md:max-w-2xl bg-white border-none shadow-2xl rounded-none p-0 overflow-y-auto max-h-[95vh]">
              <DialogHeader className="p-6 bg-[#0A3D73]">
                <DialogTitle className="text-white text-xs font-bold flex items-center gap-3 uppercase tracking-widest">
                  <Package size={18} /> {editingMaterial ? 'Modificar Material' : 'Novo Registro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Código Interno</Label>
                      <Input value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} required className={sapInput} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Segmento</Label>
                      <Select value={formData.segmento} onValueChange={(v) => setFormData({ ...formData, segmento: v })}>
                        <SelectTrigger className={sapSelectTrigger}><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white rounded-none border-slate-300 shadow-xl">
                          {SEGMENTOS.map(seg => (
                            <SelectItem key={seg} value={seg} className="text-xs font-bold uppercase focus:bg-slate-100 cursor-pointer">{seg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Descrição Técnica</Label>
                      <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required className={sapInput} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 md:col-span-2 gap-4 p-5 bg-slate-50 border border-slate-200">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[9px] uppercase flex items-center gap-1"><Scale size={12}/> Peso Unit. (KG)</Label>
                        <Input value={formData.peso_unit} onChange={(e) => setFormData({ ...formData, peso_unit: e.target.value })} className={sapInput} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[9px] uppercase flex items-center gap-1"><DollarSign size={12}/> Preço (R$)</Label>
                        <Input value={formData.preco_unit} onChange={(e) => setFormData({ ...formData, preco_unit: e.target.value })} className={sapInput} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-green-700 font-bold text-[9px] uppercase flex items-center gap-1"><Percent size={12}/> Comissão %</Label>
                        <Input value={formData.comissao} onChange={(e) => setFormData({ ...formData, comissao: e.target.value })} className={`${sapInput} border-green-200 text-green-700`} required />
                      </div>
                    </div>
                  </div>
                <div className="flex flex-col md:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button type="submit" className="w-full md:w-auto bg-[#0A3D73] hover:bg-[#082D54] text-white px-10 rounded-none text-[10px] font-bold uppercase py-6 md:py-2 order-1 md:order-2">
                    Gravar Registro
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full md:w-auto rounded-none text-slate-500 border-slate-300 py-6 md:py-2 order-2 md:order-1 transition-colors">
                    Descartar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative mb-6 bg-white border border-slate-300 p-1 shadow-inner flex items-center">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input 
          placeholder="Código ou descrição técnica..." 
          className="border-none focus:ring-0 text-slate-700 text-sm italic bg-transparent h-12 w-full outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABELA DE MATERIAIS */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A3D73] text-white text-[10px] font-bold uppercase tracking-widest text-left">
              <tr>
                <th className="px-6 py-4">Cód. FE</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Segmento</th>
                <th className="px-6 py-4 text-right">Peso Unit.</th>
                <th className="px-6 py-4 text-right">Preço Unit.</th>
                <th className="px-6 py-4 text-right">Comissão</th>
                {isAdmin && <th className="px-6 py-4"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredMateriais.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-blue-900 text-xs">{m.codigo}</td>
                  <td className="px-6 py-4 font-bold text-[13px]">{m.nome || m.descricao}</td>
                  <td className="px-6 py-4 uppercase text-[10px] font-bold text-slate-500">{m.segmento}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs">{Number(m.peso_unit || 0).toFixed(3)}kg</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">R$ {Number(m.preco_unit || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-green-700 text-xs">{m.comissao}%</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-blue-900">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-slate-300 rounded-none shadow-xl">
                          <DropdownMenuItem onClick={() => handleEdit(m)} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest gap-2">
                            <Edit size={14} className="text-blue-900" /> Alterar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(m.id)} className="cursor-pointer text-[10px] font-bold uppercase tracking-widest gap-2 text-red-600">
                            <Trash2 size={14} /> Eliminar
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
    </div>
  );
};

export default Materiais;