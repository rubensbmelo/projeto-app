import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Edit, Trash2, Search, MoreVertical, Package } from 'lucide-react';
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
    numero_fe: '', // ALTERADO: agora numero_fe
    descricao: '', 
    segmento: 'CAIXA', 
    peso_unit: '', 
    comissao: '', 
    preco_unit: ''
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

  const limparParaNumero = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0;
    const limpo = String(valor).replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

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
        numero_fe: formData.numero_fe, // ENVIANDO COMO numero_fe
        codigo: formData.numero_fe,    // MANTIDO PARA COMPATIBILIDADE COM BACKEND
        nome: formData.descricao,
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
      toast.error('Erro ao salvar');
    }
  };

  const handleEdit = (material) => {
    if (!isAdmin) return; 
    setEditingMaterial(material);
    setFormData({
      numero_fe: material.numero_fe || material.codigo || '', // PUXA FE OU CODIGO
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
    setFormData({ numero_fe: '', descricao: '', segmento: 'CAIXA', peso_unit: '', comissao: '', preco_unit: '' });
    setEditingMaterial(null);
  };

  const filteredMateriais = materiais.filter(m =>
    (m.nome?.toLowerCase() || m.descricao?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.numero_fe?.toLowerCase() || m.codigo?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const sapInput = "bg-white border-slate-300 focus:border-blue-800 focus:ring-0 rounded-none h-10 outline-none transition-all";

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
          Catálogo Base (FE)
        </h1>
        
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase py-6">
                <Plus size={16} className="mr-2" /> Novo Material (FE)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-none p-0">
              <DialogHeader className="p-6 bg-[#0A3D73] text-white text-left">
                <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <Package size={16}/> {editingMaterial ? 'Editar FE' : 'Registrar Novo FE'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Número do FE</Label>
                      <Input value={formData.numero_fe} onChange={(e) => setFormData({ ...formData, numero_fe: e.target.value.toUpperCase() })} required className={sapInput} placeholder="Ex: 1234/26" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[#0A3D73] font-bold text-[10px] uppercase">Nome do Produto (Vincular ao Pedido)</Label>
                      <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })} required className={sapInput} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:col-span-2 gap-4 p-5 bg-slate-50 border border-slate-200">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500 font-bold text-[9px] uppercase">Peso Unit (KG)</Label>
                        <Input value={formData.peso_unit} onChange={(e) => setFormData({ ...formData, peso_unit: e.target.value })} className={sapInput} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-amber-600 font-bold text-[9px] uppercase">R$ Milheiro</Label>
                        <Input value={formData.preco_unit} onChange={(e) => setFormData({ ...formData, preco_unit: e.target.value })} className={sapInput} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-green-700 font-bold text-[9px] uppercase">Comissão %</Label>
                        <Input value={formData.comissao} onChange={(e) => setFormData({ ...formData, comissao: e.target.value })} className={sapInput} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-blue-700 font-bold text-[9px] uppercase">Fator R$/KG</Label>
                        <div className="h-10 flex items-center px-3 bg-blue-50 border border-blue-200 font-black text-xs text-blue-800">
                          R$ {calcularFatorForm()}
                        </div>
                      </div>
                    </div>
                  </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none uppercase text-[10px]">Cancelar</Button>
                  <Button type="submit" className="bg-[#0A3D73] text-white px-10 rounded-none text-[10px] font-bold uppercase py-6">Gravar Material</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative mb-6 bg-white border border-slate-300 p-1 flex items-center">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input 
          placeholder="BUSCAR POR FE OU DESCRIÇÃO..." 
          className="border-none focus:ring-0 text-xs font-bold bg-transparent w-full uppercase"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#555555] text-white text-[10px] font-bold uppercase">
              <tr>
                <th className="px-6 py-4 border-r border-gray-600">FE</th>
                <th className="px-6 py-4 border-r border-gray-600">Descrição Técnica</th>
                <th className="px-6 py-4 text-right border-r border-gray-600">Peso Unit.</th>
                <th className="px-6 py-4 text-right border-r border-gray-600">Preço Milheiro</th>
                <th className="px-6 py-4 text-right bg-blue-800/20 border-r border-gray-600">R$ / KG</th>
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
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-colors text-[11px]">
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{m.numero_fe || m.codigo}</td>
                    <td className="px-6 py-4 font-bold uppercase">{m.nome || m.descricao}</td>
                    <td className="px-6 py-4 text-right text-slate-500 font-bold">{formatarMoedaBR(m.peso_unit)} kg</td>
                    <td className="px-6 py-4 text-right font-bold">R$ {formatarMoedaBR(m.preco_unit)}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-700 bg-blue-50/50">R$ {formatarMoedaBR(fator)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-700">{formatarMoedaBR(m.comissao)}%</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white rounded-none border-slate-300 shadow-xl">
                            <DropdownMenuItem onClick={() => handleEdit(m)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer p-3">
                              <Edit size={14} /> Alterar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-[10px] font-bold uppercase gap-2 cursor-pointer text-red-600 p-3">
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