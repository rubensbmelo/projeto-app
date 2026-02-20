import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileDown, FilePlus, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [itens, setItens] = useState([{ material_id: '', quantidade: 1 }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, clientesRes, materiaisRes] = await Promise.all([
        axios.get(`${API}/pedidos`),
        axios.get(`${API}/clientes`),
        axios.get(`${API}/materiais`)
      ]);
      setPedidos(pedidosRes.data);
      setClientes(clientesRes.data);
      setMateriais(materiaisRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calculateItem = (materialId, quantidade) => {
    const material = materiais.find(m => m.id === materialId);
    if (!material) return null;

    const peso_total = material.peso_unitario * quantidade;
    const valor_unitario = material.preco_unitario;
    const subtotal_sem_ipi = valor_unitario * quantidade;
    const ipi = subtotal_sem_ipi * 0.0325; // 3.25%
    const subtotal = subtotal_sem_ipi + ipi;

    return {
      material_id: materialId,
      quantidade,
      peso_total,
      valor_unitario,
      ipi,
      subtotal
    };
  };

  const handleAddItem = () => {
    setItens([...itens, { material_id: '', quantidade: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    setItens(newItens);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itensCalculados = itens
        .filter(item => item.material_id && item.quantidade > 0)
        .map(item => calculateItem(item.material_id, item.quantidade));

      if (itensCalculados.length === 0) {
        toast.error('Adicione pelo menos um item ao pedido');
        return;
      }

      const payload = {
        cliente_id: selectedCliente,
        itens: itensCalculados
      };

      await axios.post(`${API}/pedidos`, payload);
      toast.success('Pedido criado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    }
  };

  const handleUpdateStatus = async (pedidoId, newStatus, numeroFabrica = '') => {
    try {
      const payload = { status: newStatus };
      if (numeroFabrica) {
        payload.numero_pedido_fabrica = numeroFabrica;
      }
      await axios.put(`${API}/pedidos/${pedidoId}`, payload);
      toast.success('Pedido atualizado com sucesso!');
      fetchData();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const handleDownloadPDF = async (pedidoId) => {
    try {
      const response = await axios.get(`${API}/pedidos/${pedidoId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordem-compra-${pedidoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/export/pedidos`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pedidos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const resetForm = () => {
    setSelectedCliente('');
    setItens([{ material_id: '', quantidade: 1 }]);
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Digitado': 'status-badge-digitado',
      'Implantado': 'status-badge-implantado',
      'Atendido': 'status-badge-atendido',
      'Atendido Parcial': 'status-badge-parcial'
    };
    return classes[status] || 'status-badge-digitado';
  };

  const getClienteNome = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'N/A';
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const clienteNome = getClienteNome(pedido.cliente_id);
    return pedido.numero_oc.toLowerCase().includes(searchTerm.toLowerCase()) ||
           clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           pedido.status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
            Pedidos
          </h1>
          <p className="text-slate-600 mt-1">Gestão de ordens de compra</p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="export-excel-button"
            variant="outline"
            onClick={handleExportExcel}
          >
            <FileDown size={16} className="mr-2" />
            Exportar Excel
          </Button>
          <Button
            data-testid="add-pedido-button"
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <FilePlus size={16} className="mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            data-testid="search-pedidos"
            placeholder="Buscar por OC, cliente ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="pedidos-table">
            <thead>
              <tr>
                <th>OC</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Nº Fábrica</th>
                <th className="text-right">Peso Total</th>
                <th className="text-right">Valor Total</th>
                <th>Data</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Carregando...</td>
                </tr>
              ) : filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Nenhum pedido encontrado</td>
                </tr>
              ) : (
                filteredPedidos.map(pedido => (
                  <tr key={pedido.id} data-testid={`pedido-row-${pedido.id}`}>
                    <td className="font-mono font-medium text-slate-900">{pedido.numero_oc}</td>
                    <td>{getClienteNome(pedido.cliente_id)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(pedido.status)}`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td className="font-mono text-slate-600">{pedido.numero_pedido_fabrica || '-'}</td>
                    <td className="text-right font-mono">{pedido.peso_total.toFixed(2)} kg</td>
                    <td className="text-right font-mono font-medium">R$ {pedido.valor_total.toFixed(2)}</td>
                    <td className="text-slate-600">
                      {new Date(pedido.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          data-testid={`edit-pedido-${pedido.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingPedido(pedido); setEditDialogOpen(true); }}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          data-testid={`download-pdf-${pedido.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(pedido.id)}
                        >
                          <FileDown size={16} />
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

      {/* Novo Pedido Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={selectedCliente} onValueChange={setSelectedCliente} required>
                <SelectTrigger data-testid="select-cliente">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.referencia} - {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Itens do Pedido</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  Adicionar Item
                </Button>
              </div>
              {itens.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-7">
                      <Label>Material</Label>
                      <Select
                        value={item.material_id}
                        onValueChange={(value) => handleItemChange(index, 'material_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {materiais.map(mat => (
                            <SelectItem key={mat.id} value={mat.id}>
                              {mat.codigo} - {mat.descricao} ({mat.segmento})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={itens.length === 1}
                        className="w-full"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                  {item.material_id && (
                    <div className="mt-3 text-xs text-slate-600 grid grid-cols-4 gap-2">
                      {(() => {
                        const calc = calculateItem(item.material_id, item.quantidade);
                        return calc ? (
                          <>
                            <div>Peso: <span className="font-mono font-medium">{calc.peso_total.toFixed(2)} kg</span></div>
                            <div>Valor Unit: <span className="font-mono font-medium">R$ {calc.valor_unitario.toFixed(2)}</span></div>
                            <div>IPI: <span className="font-mono font-medium">R$ {calc.ipi.toFixed(2)}</span></div>
                            <div>Subtotal: <span className="font-mono font-medium text-green-700">R$ {calc.subtotal.toFixed(2)}</span></div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                Criar Pedido
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Pedido Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pedido {editingPedido?.numero_oc}</DialogTitle>
          </DialogHeader>
          {editingPedido && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={editingPedido.status}
                  onValueChange={(value) => setEditingPedido({ ...editingPedido, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Digitado">Digitado</SelectItem>
                    <SelectItem value="Implantado">Implantado</SelectItem>
                    <SelectItem value="Atendido">Atendido</SelectItem>
                    <SelectItem value="Atendido Parcial">Atendido Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número do Pedido da Fábrica</Label>
                <Input
                  value={editingPedido.numero_pedido_fabrica || ''}
                  onChange={(e) => setEditingPedido({ ...editingPedido, numero_pedido_fabrica: e.target.value })}
                  placeholder="Número gerado pelo S.A.C. da fábrica"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(
                    editingPedido.id,
                    editingPedido.status,
                    editingPedido.numero_pedido_fabrica
                  )}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
