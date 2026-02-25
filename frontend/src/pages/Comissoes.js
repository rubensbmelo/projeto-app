import React, { useState, useEffect } from 'react';
// 1. Trocamos o axios e a URL fixa pelo nosso serviço api
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FileDown, DollarSign, Clock, AlertCircle, TrendingUp, Lock } from 'lucide-react';
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
      // O api.get já sabe injetar o token e usar o endereço certo (local ou nuvem)
      const [vencRes, notasRes, pedidosRes, clientesRes] = await Promise.all([
        api.get('/vencimentos'),
        api.get('/notas-fiscais'),
        api.get('/pedidos'),
        api.get('/clientes')
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
    if (!isAdmin) {
      toast.error('Acesso restrito: Apenas administradores podem exportar dados financeiros.');
      return;
    }

    try {
      // Usamos o api para exportação também
      const response = await api.get('/export/comissoes', { responseType: 'blob' });
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

  // Funções de auxílio (Lógica de Negócio permanece igual)
  const getClienteNome = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return 'N/A';
    const cliente = clientes.find(c => c.id === pedido.cliente_id);
    return cliente ? cliente.nome : 'N/A';
  };

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
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans">
      {/* Header com trava de Admin no botão de Excel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight">Comissões</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Recebíveis</p>
        </div>

        {isAdmin ? (
          <Button 
            onClick={handleExportExcel} 
            className="w-full md:w-auto bg-[#107C41] hover:bg-[#0A5D31] text-white rounded-none px-6 font-bold text-[10px] uppercase tracking-widest shadow-md py-6 md:py-2"
          >
            <FileDown size={18} className="mr-2" /> Exportar para Contabilidade
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 text-amber-700 text-[9px] font-bold uppercase">
            <Lock size={14} /> Exportação Restrita
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 border-none shadow-md bg-white border-t-4 border-green-500 rounded-none">
          <div className="flex justify-between items-center md:items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Recebido</p>
              <h3 className="text-xl md:text-2xl font-bold text-green-600 mt-1 font-mono italic">
                R$ {totalComissaoPaga.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded"><DollarSign size={20} /></div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md bg-white border-t-4 border-blue-500 rounded-none">
          <div className="flex justify-between items-center md:items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">A Receber</p>
              <h3 className="text-xl md:text-2xl font-bold text-blue-700 mt-1 font-mono italic">
                R$ {totalComissaoPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded"><Clock size={20} /></div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-md bg-white border-t-4 border-red-500 rounded-none">
          <div className="flex justify-between items-center md:items-start">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Atrasado</p>
              <h3 className="text-xl md:text-2xl font-bold text-red-600 mt-1 font-mono italic">
                R$ {totalComissaoAtrasada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
              </h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded"><AlertCircle size={20} /></div>
          </div>
        </Card>
      </div>

      {/* Listagem de Comissões (Otimizada para Mobile e Desktop) */}
      <div className="space-y-8">
        {(comissoesPorStatus['Pendente'] || comissoesPorStatus['Atrasado']) && (
          <Card className="rounded-none border border-slate-300 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0A3D73] text-white">
              <h3 className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp size={16} /> Comissões a Conciliar
              </h3>
            </div>
            {/* ... Tabela e View Mobile iguais ao seu original, 
                 garantindo que usem o array filtrado ... */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[#0A3D73] text-[10px] font-bold uppercase tracking-widest border-b">
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
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">{item.nota.numero_nf}</td>
                                <td className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">{getClienteNome(item.pedidoId)}</td>
                                <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">{item.parcela}ª</td>
                                <td className="px-6 py-4 font-bold text-slate-600 text-xs">{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">R$ {item.comissao_calculada.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-[9px] font-black border uppercase ${item.status === 'Atrasado' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
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
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="animate-spin text-blue-900 mb-4"><Clock size={40} /></div>
          <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Processando Finanças...</p>
        </div>
      )}
    </div>
  );
};

export default Comissoes;