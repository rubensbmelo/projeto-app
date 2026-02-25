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

  useEffect(() => { 
    fetchMateriais(); 
    // Segurança: se em 5 segundos não carregar, libera a tela
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchMateriais = async () => {
    try {
      const response = await api.get('/materiais');
      setMateriais(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao carregar materiais:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    return parseFloat(String(valor).replace(',', '.')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Sem permissão');

    try {
      const payload = {
        nome: formData.descricao,
        codigo: formData.codigo,
        descricao: formData.descricao,
        segmento: formData.segmento,
        peso_unit: parseMoeda(formData.peso_unit),
        comissao: parseMoeda(formData.comissao),
        preco_unit: parseMoeda(formData.preco_unit)
      };

      if (editingMaterial) {
        await api.put(`/materiais/${editingMaterial.id}`, payload);
        toast.success('Atualizado!');
      } else {
        await api.post('/materiais', payload);
        toast.success('Cadastrado!');
      }
      setDialogOpen(false);
      setFormData({ codigo: '', descricao: '', segmento: 'CAIXA', peso_unit: '', comissao: '', preco_unit: '' });
      setEditingMaterial(null);
      fetchMateriais();
    } catch (error) {
      toast.error('Erro ao salvar dados');
    }
  };

  const filteredMateriais = materiais.filter(m =>
    (m.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.codigo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (m.descricao?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-blue-900">Iniciando Catálogo...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Produtos {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0A3D73] text-white rounded-none px-8 font-bold text-[10px] uppercase tracking-widest py-6">
                <Plus size={16} className="mr-2" /> Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white rounded-none">
              <DialogHeader className="p-6 bg-[#0A3D73]">
                <DialogTitle className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Package size={18} /> Registro de Material
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Código</Label><Input value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="rounded-none border-slate-300" /></div>
                  <div className="space-y-1"><Label>Segmento</Label>
                    <Select value={formData.segmento} onValueChange={v => setFormData({...formData, segmento: v})}>
                      <SelectTrigger className="rounded-none border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">{SEGMENTOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1"><Label>Descrição</Label><Input value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="rounded-none border-slate-300" /></div>
                  <div className="space-y-1"><Label>Peso (kg)</Label><Input value={formData.peso_unit} onChange={e => setFormData({...formData, peso_unit: e.target.value})} className="rounded-none border-slate-300" /></div>
                  <div className="space-y-1"><Label>Preço (R$)</Label><Input value={formData.preco_unit} onChange={e => setFormData({...formData, preco_unit: e.target.value})} className="rounded-none border-slate-300" /></div>
                  <div className="space-y-1"><Label>Comissão %</Label><Input value={formData.comissao} onChange={e => setFormData({...formData, comissao: e.target.value})} className="rounded-none border-slate-300" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4"><Button type="submit" className="bg-[#0A3D73] text-white rounded-none">Salvar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white border border-slate-300 p-1 mb-6 flex items-center">
        <Search className="ml-4 text-slate-400" size={18} />
        <Input placeholder="Pesquisar..." className="border-none focus:ring-0 text-sm italic" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="border border-slate-300 rounded-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A3D73] text-white text-[10px] font-bold uppercase text-left">
              <tr>
                <th className="px-6 py-4">Cód</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Peso</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMateriais.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 text-sm">
                  <td className="px-6 py-4 font-mono font-bold">{m.codigo}</td>
                  <td className="px-6 py-4 font-bold uppercase">{m.nome || m.descricao}</td>
                  <td className="px-6 py-4">{Number(m.peso_unit || 0).toFixed(3)}kg</td>
                  <td className="px-6 py-4 font-bold text-blue-900">R$ {Number(m.preco_unit || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingMaterial(m); setFormData({ ...m, descricao: m.nome || m.descricao }); setDialogOpen(true); }}>
                      <Edit size={14} />
                    </Button>
                  </td>
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