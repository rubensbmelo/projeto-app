import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FileDown, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';
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
      toast.error('Erro ao carregar relatório financeiro');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/export/comissoes`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_comissoes_${new Date().getMonth()+1}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Relatório exportado!');
    } catch (error) {
      toast.error('Erro ao gerar Excel');
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
    return pedido ? pedido.numero_oc : '---';
  };

  // Agrupamento e Totais
  const totalComissaoPaga = vencimentos.filter(v => v.status === 'Pago').reduce((sum, v) => sum + v.comissao_calculada, 0);
  const totalComissaoPendente = vencimentos.filter(v => v.status === 'Pendente').reduce((sum, v) => sum + v.comissao_calculada, 0);
  const totalComissaoAtrasada = vencimentos.filter(v => v.status === 'Atrasado').reduce((sum, v) => sum + v.comissao_calculada, 0);

  const comissoesPorStatus = vencimentos.reduce((acc, venc) => {
    const nota = notas.find(n => n.id === venc.nota_fiscal_id);
    if (nota) {
      if (!acc[venc.status]) acc[venc.status] = [];
      acc[venc.status].push({ ...venc, nota, pedidoId: nota.pedido_id });
    }
    return acc;
  }, {});

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Comissões</h1>
          <p className="text-slate-500 font-medium">Fluxo de caixa e recebíveis por período</p>
        </div>
        <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
          <FileDown size={18} className="mr-2" /> Exportar para Contabilidade
        </Button>
      </div>

      {/* Cards de Resumo Estilizados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Recebido</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-mono">R$ {totalComissaoPaga.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign size={20} /></div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white border-l-4 border-l-slate-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">A Receber (Previsto)</p>
              <h3 className="text-2xl font-bold text-slate-700 mt-1 font-mono">R$ {totalComissaoPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Clock size={20} /></div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Atrasado / Cobrança</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1 font-mono">R$ {totalComissaoAtrasada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertCircle size={20} /></div>
          </div>
        </Card>
      </div>

      {/* Listagens */}
      <div className="space-y-8">
        {/* Tabela Pendentes e Atrasadas (O que você precisa monitorar) */}
        {(comissoesPorStatus['Pendente'] || comissoesPorStatus['Atrasado']) && (
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
              <TrendingUp size={18} />
              <h3 className="font-semibold">Comissões a Conciliar (Pendentes/Atrasadas)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">NF</th>
                    <th className="px-6 py-4 text-left">Cliente</th>
                    <th className="px-6 py-4 text-center">Parcela</th>
                    <th className="px-6 py-4 text-left">Vencimento</th>
                    <th className="px-6 py-4 text-right">Comissão</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {[...(comissoesPorStatus['Atrasado'] || []), ...(comissoesPorStatus['Pendente'] || [])].map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{item.nota.numero_nf}</td>
                      <td className="px-6 py-4 font-medium">{getClienteNome(item.pedidoId)}</td>
                      <td className="px-6 py-4 text-center text-slate-500">{item.parcela}ª</td>
                      <td className="px-6 py-4 font-medium">{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        R$ {item.comissao_calculada.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          item.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Histórico de Pagas (Menor destaque para limpar a visão) */}
        {comissoesPorStatus['Pago'] && (
          <div className="opacity-80">
            <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <div className="h-px bg-slate-200 flex-1"></div> Histórico de Pagamentos <div className="h-px bg-slate-200 flex-1"></div>
            </h4>
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-6 py-3 text-left">NF</th>
                      <th className="px-6 py-3 text-left">Cliente</th>
                      <th className="px-6 py-3 text-left">Data Recebimento</th>
                      <th className="px-6 py-3 text-right">Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {comissoesPorStatus['Pago'].map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-3 font-mono text-slate-400">{item.nota.numero_nf}</td>
                        <td className="px-6 py-3 text-slate-500">{getClienteNome(item.pedidoId)}</td>
                        <td className="px-6 py-3 text-slate-500">
                          {item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-medium text-emerald-600">
                          R$ {item.comissao_calculada.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="animate-spin mb-4"><Clock size={32} /></div>
          <p className="font-medium">Sincronizando dados financeiros...</p>
        </div>
      )}
    </div>
  );
};

export default Comissoes;