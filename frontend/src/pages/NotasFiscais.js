import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FilePlus, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NotasFiscais = () => {
  const [notas, setNotas] = useState([]);
  const [vencimentos, setVencimentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    numero_nf: '',
    pedido_id: '',
    valor_total: '',
    numero_parcelas: '1',
    data_primeira_parcela: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notasRes, vencimentosRes, pedidosRes] = await Promise.all([
        axios.get(`${API}/notas-fiscais`),
        axios.get(`${API}/vencimentos`),
        axios.get(`${API}/pedidos`)
      ]);
      setNotas(notasRes.data);
      setVencimentos(vencimentosRes.data);
      setPedidos(pedidosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        valor_total: parseFloat(formData.valor_total),
        numero_parcelas: parseInt(formData.numero_parcelas)
      };
      await axios.post(`${API}/notas-fiscais`, payload);
      toast.success('Nota fiscal criada com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar nota fiscal:', error);
      toast.error('Erro ao criar nota fiscal');
    }
  };

  const handleUpdateVencimento = async (vencimentoId, status, dataPagamento = null) => {
    try {
      const payload = { status };
      if (dataPagamento) {
        payload.data_pagamento = dataPagamento;
      }
      await axios.put(`${API}/vencimentos/${vencimentoId}`, payload);
      toast.success('Vencimento atualizado!');
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar vencimento:', error);
      toast.error('Erro ao atualizar vencimento');
    }
  };

  const handleMarcarPago = (vencimentoId) => {
    const hoje = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    handleUpdateVencimento(vencimentoId, 'Pago', hoje);
  };

  const resetForm = () => {
    setFormData({
      numero_nf: '',
      pedido_id: '',
      valor_total: '',
      numero_parcelas: '1',
      data_primeira_parcela: ''
    });
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Pago': 'status-badge-pago',
      'Pendente': 'status-badge-pendente',
      'Atrasado': 'status-badge-atrasado'
    };
    return classes[status] || 'status-badge-pendente';
  };

  const getStatusIcon = (status) => {
    if (status === 'Pago') return <CheckCircle size={16} className="text-green-600" />;
    if (status === 'Atrasado') return <XCircle size={16} className="text-red-600" />;
    return <Clock size={16} className="text-slate-600" />;
  };

  const getPedidoInfo = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    return pedido ? pedido.numero_oc : 'N/A';
  };

  const filteredNotas = notas.filter(nota =>
    nota.numero_nf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPedidoInfo(nota.pedido_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
            Notas Fiscais
          </h1>
          <p className="text-slate-600 mt-1">Gestão de notas fiscais e vencimentos</p>
        </div>
        <Button
          data-testid="add-nota-button"
          onClick={() => setDialogOpen(true)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <FilePlus size={16} className="mr-2" />
          Nova Nota Fiscal
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            data-testid="search-notas"
            placeholder="Buscar por número de NF ou OC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Notas Fiscais */}
      <Card className="mb-6">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Notas Fiscais</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="notas-table">
            <thead>
              <tr>
                <th>Número NF</th>
                <th>Pedido (OC)</th>
                <th>Data Emissão</th>
                <th className="text-right">Valor Total</th>
                <th className="text-center">Parcelas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Carregando...</td>
                </tr>
              ) : filteredNotas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">Nenhuma nota fiscal encontrada</td>
                </tr>
              ) : (
                filteredNotas.map(nota => (
                  <tr key={nota.id} data-testid={`nota-row-${nota.id}`}>
                    <td className="font-mono font-medium text-slate-900">{nota.numero_nf}</td>
                    <td className="font-mono">{getPedidoInfo(nota.pedido_id)}</td>
                    <td>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</td>
                    <td className="text-right font-mono font-medium">R$ {nota.valor_total.toFixed(2)}</td>
                    <td className="text-center">{nota.numero_parcelas}x</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vencimentos */}
      <Card>
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Vencimentos / Parcelas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="vencimentos-table">
            <thead>
              <tr>
                <th>NF</th>
                <th className="text-center">Parcela</th>
                <th className="text-right">Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th className="text-right">Comissão</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Carregando...</td>
                </tr>
              ) : vencimentos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">Nenhum vencimento encontrado</td>
                </tr>
              ) : (
                vencimentos.map(venc => {
                  const nota = notas.find(n => n.id === venc.nota_fiscal_id);
                  return (
                    <tr key={venc.id} data-testid={`vencimento-row-${venc.id}`}>
                      <td className="font-mono">{nota?.numero_nf || 'N/A'}</td>
                      <td className="text-center font-medium">{venc.parcela}</td>
                      <td className="text-right font-mono">R$ {venc.valor.toFixed(2)}</td>
                      <td>{new Date(venc.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(venc.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(venc.status)}`}>
                            {venc.status}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        {venc.data_pagamento ? new Date(venc.data_pagamento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="text-right font-mono font-medium text-green-700">
                        R$ {venc.comissao_calculada.toFixed(2)}
                      </td>
                      <td className="text-right">
                        {venc.status !== 'Pago' && (
                          <Button
                            data-testid={`marcar-pago-${venc.id}`}
                            size="sm"
                            onClick={() => handleMarcarPago(venc.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Marcar Pago
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Nova Nota Fiscal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Nota Fiscal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="numero_nf">Número da NF</Label>
              <Input
                id="numero_nf"
                data-testid="input-numero-nf"
                value={formData.numero_nf}
                onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                required
                placeholder="000000"
              />
            </div>
            <div>
              <Label>Pedido (OC)</Label>
              <Select
                value={formData.pedido_id}
                onValueChange={(value) => setFormData({ ...formData, pedido_id: value })}
                required
              >
                <SelectTrigger data-testid="select-pedido">
                  <SelectValue placeholder="Selecione um pedido" />
                </SelectTrigger>
                <SelectContent>
                  {pedidos.filter(p => p.status === 'Implantado' || p.status === 'Digitado').map(pedido => (
                    <SelectItem key={pedido.id} value={pedido.id}>
                      {pedido.numero_oc} - R$ {pedido.valor_total.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_total">Valor Total</Label>
                <Input
                  id="valor_total"
                  data-testid="input-valor-total"
                  type="number"
                  step="0.01"
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="numero_parcelas">Nº Parcelas</Label>
                <Select
                  value={formData.numero_parcelas}
                  onValueChange={(value) => setFormData({ ...formData, numero_parcelas: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="data_primeira_parcela">Data 1ª Parcela</Label>
              <Input
                id="data_primeira_parcela"
                data-testid="input-data-parcela"
                type="text"
                value={formData.data_primeira_parcela}
                onChange={(e) => setFormData({ ...formData, data_primeira_parcela: e.target.value })}
                required
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                Criar Nota Fiscal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotasFiscais;
