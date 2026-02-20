import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Comissoes = () => {
  const [vencimentos, setVencimentos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vencRes, notasRes, pedidosRes, clientesRes] = await Promise.all([
        axios.get(`${API}/vencimentos`),
        axios.get(`${API}/notas-fiscais`),
        axios.get(`${API}/pedidos`),
        axios.get(`${API}/clientes`)
      ]);
      setVencimentos(vencRes.data);
      setNotas(notasRes.data);
      setPedidos(pedidosRes.data);
      setClientes(clientesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/export/comissoes`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'comissoes.xlsx');
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

  const getClienteNome = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return 'N/A';
    const cliente = clientes.find(c => c.id === pedido.cliente_id);
    return cliente ? cliente.nome : 'N/A';
  };

  const getPedidoOC = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    return pedido ? pedido.numero_oc : 'N/A';
  };

  const comissoesPorStatus = vencimentos.reduce((acc, venc) => {
    if (!acc[venc.status]) {
      acc[venc.status] = [];
    }
    const nota = notas.find(n => n.id === venc.nota_fiscal_id);
    if (nota) {
      acc[venc.status].push({
        ...venc,
        nota,
        pedidoId: nota.pedido_id
      });
    }
    return acc;
  }, {});

  const totalComissaoPaga = vencimentos
    .filter(v => v.status === 'Pago')
    .reduce((sum, v) => sum + v.comissao_calculada, 0);

  const totalComissaoPendente = vencimentos
    .filter(v => v.status === 'Pendente')
    .reduce((sum, v) => sum + v.comissao_calculada, 0);

  const totalComissaoAtrasada = vencimentos
    .filter(v => v.status === 'Atrasado')
    .reduce((sum, v) => sum + v.comissao_calculada, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
            Comissões
          </h1>
          <p className="text-slate-600 mt-1">Relatório detalhado de comissões</p>
        </div>
        <Button
          data-testid="export-comissoes-button"
          onClick={handleExportExcel}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <FileDown size={16} className="mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 border-green-200 bg-green-50" data-testid="comissao-paga-card">
          <div>
            <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Comissão Paga</p>
            <h3 className="text-3xl font-bold text-green-900 mt-2 font-mono">
              R$ {totalComissaoPaga.toFixed(2)}
            </h3>
            <p className="text-sm text-green-700 mt-2">
              {vencimentos.filter(v => v.status === 'Pago').length} parcelas liquidadas
            </p>
          </div>
        </Card>

        <Card className="p-6 border-yellow-200 bg-yellow-50" data-testid="comissao-pendente-card">
          <div>
            <p className="text-sm font-medium text-yellow-600 uppercase tracking-wider">Comissão Pendente</p>
            <h3 className="text-3xl font-bold text-yellow-900 mt-2 font-mono">
              R$ {totalComissaoPendente.toFixed(2)}
            </h3>
            <p className="text-sm text-yellow-700 mt-2">
              {vencimentos.filter(v => v.status === 'Pendente').length} parcelas aguardando
            </p>
          </div>
        </Card>

        <Card className="p-6 border-red-200 bg-red-50" data-testid="comissao-atrasada-card">
          <div>
            <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Comissão Atrasada</p>
            <h3 className="text-3xl font-bold text-red-900 mt-2 font-mono">
              R$ {totalComissaoAtrasada.toFixed(2)}
            </h3>
            <p className="text-sm text-red-700 mt-2">
              {vencimentos.filter(v => v.status === 'Atrasado').length} parcelas vencidas
            </p>
          </div>
        </Card>
      </div>

      {/* Tabela Detalhada - Pagas */}
      {comissoesPorStatus['Pago']?.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 bg-green-50 border-b border-green-200">
            <h3 className="font-semibold text-green-900">Comissões Pagas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NF</th>
                  <th>Pedido (OC)</th>
                  <th>Cliente</th>
                  <th className="text-center">Parcela</th>
                  <th>Vencimento</th>
                  <th>Pagamento</th>
                  <th className="text-right">Valor Parcela</th>
                  <th className="text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {comissoesPorStatus['Pago'].map(item => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.nota.numero_nf}</td>
                    <td className="font-mono">{getPedidoOC(item.pedidoId)}</td>
                    <td>{getClienteNome(item.pedidoId)}</td>
                    <td className="text-center">{item.parcela}</td>
                    <td>{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td>{item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="text-right font-mono">R$ {item.valor.toFixed(2)}</td>
                    <td className="text-right font-mono font-medium text-green-700">R$ {item.comissao_calculada.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tabela Detalhada - Pendentes */}
      {comissoesPorStatus['Pendente']?.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <h3 className="font-semibold text-yellow-900">Comissões Pendentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NF</th>
                  <th>Pedido (OC)</th>
                  <th>Cliente</th>
                  <th className="text-center">Parcela</th>
                  <th>Vencimento</th>
                  <th className="text-right">Valor Parcela</th>
                  <th className="text-right">Comissão Prevista</th>
                </tr>
              </thead>
              <tbody>
                {comissoesPorStatus['Pendente'].map(item => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.nota.numero_nf}</td>
                    <td className="font-mono">{getPedidoOC(item.pedidoId)}</td>
                    <td>{getClienteNome(item.pedidoId)}</td>
                    <td className="text-center">{item.parcela}</td>
                    <td>{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="text-right font-mono">R$ {item.valor.toFixed(2)}</td>
                    <td className="text-right font-mono font-medium text-yellow-700">R$ {item.comissao_calculada.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tabela Detalhada - Atrasadas */}
      {comissoesPorStatus['Atrasado']?.length > 0 && (
        <Card>
          <div className="p-4 bg-red-50 border-b border-red-200">
            <h3 className="font-semibold text-red-900">Comissões Atrasadas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NF</th>
                  <th>Pedido (OC)</th>
                  <th>Cliente</th>
                  <th className="text-center">Parcela</th>
                  <th>Vencimento</th>
                  <th className="text-right">Valor Parcela</th>
                  <th className="text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {comissoesPorStatus['Atrasado'].map(item => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.nota.numero_nf}</td>
                    <td className="font-mono">{getPedidoOC(item.pedidoId)}</td>
                    <td>{getClienteNome(item.pedidoId)}</td>
                    <td className="text-center">{item.parcela}</td>
                    <td>{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="text-right font-mono">R$ {item.valor.toFixed(2)}</td>
                    <td className="text-right font-mono font-medium text-red-700">R$ {item.comissao_calculada.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">
          Carregando dados de comissões...
        </div>
      )}

      {!loading && vencimentos.length === 0 && (
        <Card className="p-12 text-center text-slate-500">
          Nenhuma comissão registrada ainda
        </Card>
      )}
    </div>
  );
};

export default Comissoes;
