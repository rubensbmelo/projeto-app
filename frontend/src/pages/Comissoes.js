import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FileDown, DollarSign, Clock, AlertCircle, TrendingUp, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const Comissoes = () => {
  const { isAdmin } = useAuth(); 
  
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
        api.get('/vencimentos'),
        api.get('/notas-fiscais'),
        api.get('/pedidos'),
        api.get('/clientes')
      ]);
      setVencimentos(vencRes.data || []);
      setNotas(notasRes.data || []);
      setPedidos(pedidosRes.data || []);
      setClientes(clientesRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar relatório financeiro');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!isAdmin) {
      toast.error('Acesso restrito para exportação.');
      return;
    }

    try {
      const response = await api.get('/export/comissoes', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comissoes_${new Date().toLocaleDateString('pt-BR')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar arquivo Excel');
    }
  };

  const getClienteNome = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return 'N/A';
    // Verifica se existe o objeto cliente ou se é o nome direto (compatibilidade)
    return pedido.cliente?.razao_social || pedido.cliente_nome || 'Cliente não identificado';
  };

  // Cálculos de Totais
  const totalComissaoPaga = vencimentos
    .filter(v => v.status === 'Pago')
    .reduce((sum, v) => sum + (Number(v.comissao_calculada) || 0), 0);

  const totalComissaoPendente = vencimentos
    .filter(v => v.status === 'Pendente')
    .reduce((sum, v) => sum + (Number(v.comissao_calculada) || 0), 0);

  const totalComissaoAtrasada = vencimentos
    .filter(v => v.status === 'Atrasado')
    .reduce((sum, v) => sum + (Number(v.comissao_calculada) || 0), 0);

  // Organização dos dados por status
  const comissoesPorStatus = vencimentos.reduce((acc, venc) => {
    const nota = notas.find(n => n.id === venc.nota_fiscal_id);
    if (nota) {
      if (!acc[venc.status]) acc[venc.status] = [];
      acc[venc.status].push({ ...venc, nota, pedidoId: nota.pedido_id });
    }
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight">Relatório de Comissões</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Consolidado Financeiro</p>
        </div>

        {isAdmin ? (
          <Button 
            onClick={handleExportExcel} 
            className="w-full md:w-auto bg-[#107C41] hover:bg-[#0A5D31] text-white rounded-none px-6 font-bold text-[10px] uppercase tracking-widest shadow-md py-6"
          >
            <FileDown size={18} className="mr-2" /> Exportar para Excel
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 text-slate-400 text-[9px] font-bold uppercase">
            <Lock size={14} /> Somente Leitura
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 border-none shadow-md bg-white border-l-4 border-green-500 rounded-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Recebido (Pago)</p>
              <h3 className="text-xl md:text-2xl font-bold text-green-600 mt-1 font-mono">
                R$ {totalComissaoPaga.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded"><CheckCircle2 size={20} /></div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md bg-white border-l-4 border-blue-500 rounded-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">A Receber (Em Aberto)</p>
              <h3 className="text-xl md:text-2xl font-bold text-blue-700 mt-1 font-mono">
                R$ {totalComissaoPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded"><Clock size={20} /></div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md bg-white border-l-4 border-red-500 rounded-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">Atrasado</p>
              <h3 className="text-xl md:text-2xl font-bold text-red-600 mt-1 font-mono">
                R$ {totalComissaoAtrasada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded"><AlertCircle size={20} /></div>
          </div>
        </Card>
      </div>

      <div className="space-y-8">
        {/* SEÇÃO: PENDENTES E ATRASADOS */}
        <Card className="rounded-none border border-slate-300 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#0A3D73] text-white">
            <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={16} /> Fluxo de Caixa Futuro (Comissões)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[#0A3D73] text-[10px] font-bold uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">NF</th>
                  <th className="px-6 py-4">Cliente / Razão Social</th>
                  <th className="px-6 py-4 text-center">Parcela</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-right">Valor Comissão</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[...(comissoesPorStatus['Atrasado'] || []), ...(comissoesPorStatus['Pendente'] || [])].length > 0 ? (
                  [...(comissoesPorStatus['Atrasado'] || []), ...(comissoesPorStatus['Pendente'] || [])].map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">NF {item.nota?.numero_nf}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-xs uppercase truncate max-w-[200px]">{getClienteNome(item.pedidoId)}</td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">{item.parcela}ª</td>
                      <td className="px-6 py-4 font-bold text-slate-600 text-xs">
                        {new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-blue-900 text-xs">
                        R$ {Number(item.comissao_calculada).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-[9px] font-black border uppercase ${
                          item.status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 text-xs italic">Nenhuma comissão pendente encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SEÇÃO: PAGOS (HISTÓRICO) */}
        {comissoesPorStatus['Pago'] && (
           <Card className="rounded-none border border-slate-300 shadow-lg overflow-hidden opacity-90">
            <div className="p-4 bg-slate-800 text-white">
              <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle2 size={16} /> Histórico de Recebimentos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b">
                  <tr>
                    <th className="px-6 py-4">NF</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Data Pagamento</th>
                    <th className="px-6 py-4 text-right">Comissão Paga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {comissoesPorStatus['Pago'].map(item => (
                    <tr key={item.id} className="bg-green-50/20">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">NF {item.nota?.numero_nf}</td>
                      <td className="px-6 py-4 text-xs font-bold uppercase">{getClienteNome(item.pedidoId)}</td>
                      <td className="px-6 py-4 text-xs">
                        {item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-700 text-xs">
                        R$ {Number(item.comissao_calculada).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </Card>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="animate-spin text-blue-900 mb-4"><Clock size={40} /></div>
          <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest font-sans">Sincronizando Relatórios...</p>
        </div>
      )}
    </div>
  );
};

export default Comissoes;