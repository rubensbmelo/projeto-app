import React, { useState, useEffect } from 'react';
// 1. Trocamos axios pelo serviço configurado
import api from '../services/api'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { Card } from '../components/ui/card';
import { 
  TrendingUp, FileText, DollarSign, Receipt, Clock, Info, 
  BarChart3, Calendar, Target, ChevronRight, Weight, Lock 
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth(); 
  
  const [stats, setStats] = useState({
    tonelagem_implantada: 0,
    comissao_prevista: 0,
    tonelagem_faturada: 0,
    comissao_realizada: 0,
    pedidos_mes_valor: 0,
    faturado_mes_valor: 0,
    comissao_mes: 0,
    comissoes_a_receber: 0
  });
  const [metaGlobal, setMetaGlobal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchStats();
    fetchMetas();
  }, []);

  const fetchStats = async () => {
    try {
      // Agora usa o interceptor para enviar o Token JWT
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao sincronizar indicadores');
    } finally { setLoading(false); }
  };

  const fetchMetas = async () => {
    try {
      const res = await api.get('/metas');
      const mesAtual = (new Date().getMonth() + 1).toString();
      const totalMeta = res.data
        .filter(m => m.mes === mesAtual)
        .reduce((acc, m) => acc + parseFloat(m.valor_ton || 0), 0);
      setMetaGlobal(totalMeta);
    } catch (e) { console.error("Erro ao buscar metas"); }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const porcentagemMeta = metaGlobal > 0 ? (stats.tonelagem_faturada / metaGlobal) * 100 : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 px-6 text-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Turbo 2.0: Sincronizando Núcleo...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b-2 border-blue-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Turbo <span className="text-blue-600">2.0</span></h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-900" /> Inteligência Operacional em Tempo Real
          </p>
        </div>
        <div className="flex gap-2">
            {!isAdmin && (
              <div className="flex items-center gap-2 bg-slate-200 px-3 py-1.5 border border-slate-300">
                <Lock size={12} className="text-slate-500" />
                <span className="text-[9px] font-black text-slate-500 uppercase">Acesso Somente Leitura</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 shadow-sm">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
            </div>
        </div>
      </div>

      {/* SEÇÃO 1: METAS E PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-6 bg-white rounded-none border-none shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progresso da Meta Mensal</p>
                    <h2 className="text-2xl font-black text-[#0A3D73] uppercase">Status de Tonelagem</h2>
                </div>
                <Target className="text-slate-200 group-hover:text-blue-900 transition-colors" size={40} />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-4xl font-black text-slate-900">{stats.tonelagem_faturada.toFixed(1)}</span>
                        <span className="text-sm font-bold text-slate-400 ml-2">/ {metaGlobal.toFixed(1)} TON</span>
                    </div>
                    <span className={`text-lg font-black ${porcentagemMeta >= 100 ? 'text-green-600' : 'text-blue-900'}`}>
                        {porcentagemMeta.toFixed(1)}%
                    </span>
                </div>
                
                <div className="w-full bg-slate-100 h-4 rounded-none overflow-hidden flex">
                    <div 
                        className={`h-full transition-all duration-1000 ${porcentagemMeta >= 100 ? 'bg-green-500' : 'bg-[#0A3D73]'}`}
                        style={{ width: `${Math.min(porcentagemMeta, 100)}%` }}
                    />
                </div>
            </div>
            
            {isAdmin && (
              <button 
                  onClick={() => navigate('/metas')}
                  className="mt-6 w-full py-3 bg-slate-50 hover:bg-[#0A3D73] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100"
              >
                  Ver Detalhamento por Cliente <ChevronRight size={14} />
              </button>
            )}
        </Card>

        {/* COMISSÃO REALIZADA */}
        <Card className="p-6 bg-[#0A3D73] text-white rounded-none border-none shadow-xl flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <DollarSign className="text-blue-300" size={24} />
                    <span className="bg-blue-500/30 text-[9px] px-2 py-1 font-bold rounded-none uppercase">Disponível</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Comissão Líquida (Faturada)</p>
                <h2 className="text-3xl font-black mt-1 font-mono">{formatCurrency(stats.comissao_realizada)}</h2>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10">
                <p className="text-[9px] font-bold uppercase opacity-50 mb-1 font-mono">Total Previsto (Implantado)</p>
                <p className="text-lg font-bold opacity-80 font-mono">{formatCurrency(stats.comissao_prevista)}</p>
            </div>
        </Card>
      </div>

      {/* SEÇÃO 2: OPERACIONAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card 
            onClick={() => navigate('/pedidos')}
            className="p-6 bg-white rounded-none border-none shadow-md border-l-4 border-blue-600 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Volume em Carteira</p>
              <h3 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                {stats.tonelagem_implantada.toFixed(3)} <span className="text-sm font-normal text-slate-400">TON</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Pedidos aguardando faturamento</p>
            </div>
            <Weight size={32} className="text-slate-100" />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-none border-none shadow-md border-l-4 border-green-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Faturamento Bruto</p>
              <h3 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                {formatCurrency(stats.faturado_mes_valor)}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Total de NFs emitidas no mês</p>
            </div>
            <Receipt size={32} className="text-slate-100" />
          </div>
        </Card>
      </div>

      {/* MINI INDICADORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Venda Bruta', val: stats.pedidos_mes_valor, icon: FileText },
          { title: 'Comissão Mês', val: stats.comissao_mes, icon: DollarSign },
          { title: 'Saldo Global', val: stats.comissoes_a_receber, icon: Clock },
          { title: 'Meta Restante', val: Math.max(0, metaGlobal - stats.tonelagem_faturada), icon: Target, isTon: true },
        ].map((item, i) => (
          <Card key={i} className="p-4 border border-slate-200 shadow-sm bg-white rounded-none">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{item.title}</p>
            <h4 className="text-sm md:text-lg font-bold text-slate-800 font-mono">
                {item.isTon ? `${item.val.toFixed(1)} TON` : formatCurrency(item.val)}
            </h4>
          </Card>
        ))}
      </div>

      {/* RODAPÉ INFORMATIVO */}
      <div className="bg-slate-800 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
              <Info className="text-blue-400" size={20} />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                O Dashboard Turbo sincroniza com a logística a cada atualização de Nota Fiscal.
              </p>
          </div>
          {isAdmin ? (
            <button 
              onClick={() => window.location.reload()}
              className="text-[10px] font-black uppercase border border-white/20 px-4 py-2 hover:bg-white hover:text-slate-800 transition-all"
            >
                Forçar Sincronismo
            </button>
          ) : (
            <span className="text-[9px] font-bold text-slate-500 uppercase italic">Dados atualizados automaticamente</span>
          )}
      </div>
    </div>
  );
};

export default Dashboard;