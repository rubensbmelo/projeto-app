import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { TrendingUp, FileText, DollarSign, Receipt, Clock, Info, ArrowUpRight, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Não foi possível atualizar os indicadores');
    } finally { setLoading(false); }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Consolidando indicadores...</p>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Performance</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <BarChart3 size={16} /> Visão geral de vendas e comissões do período
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atualizado em</span>
          <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Destaques de Tonelagem (Cockpit Principal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card Tonelagem Implantada */}
        <Card className="relative overflow-hidden border-none shadow-sm bg-white group p-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Pedidos Implantados</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                    {stats.tonelagem_implantada.toFixed(3)}
                  </h3>
                  <span className="text-lg font-bold text-slate-400">TON</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Comissão Prevista</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(stats.comissao_prevista)}</span>
            </div>
          </div>
        </Card>

        {/* Card Tonelagem Faturada */}
        <Card className="relative overflow-hidden border-none shadow-sm bg-white group p-1">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Efetivamente Faturado</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                    {stats.tonelagem_faturada.toFixed(3)}
                  </h3>
                  <span className="text-lg font-bold text-slate-400">TON</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm text-slate-500 font-medium">Comissão Realizada</span>
              <span className="text-sm font-bold text-emerald-700">{formatCurrency(stats.comissao_realizada)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid de Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Valor em Pedidos', val: stats.pedidos_mes_valor, icon: FileText, color: 'indigo' },
          { title: 'Valor Faturado', val: stats.faturado_mes_valor, icon: Receipt, color: 'slate' },
          { title: 'Comissão Mensal', val: stats.comissao_mes, icon: DollarSign, color: 'emerald' },
          { title: 'Saldo a Receber', val: stats.comissoes_a_receber, icon: Clock, color: 'amber' },
        ].map((item, i) => (
          <Card key={i} className="p-5 border-none shadow-sm bg-white hover:ring-1 hover:ring-slate-200 transition-all">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${item.color}-50 text-${item.color}-600`}>
                  <item.icon size={18} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.title}</p>
                <h4 className="text-xl font-bold text-slate-800 font-mono mt-1">{formatCurrency(item.val)}</h4>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Seção Educativa / Legenda */}
      <Card className="border-none shadow-sm bg-slate-900 text-slate-300">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 text-white">
            <Info size={20} className="text-indigo-400" />
            <h3 className="font-bold tracking-tight">Glossário de Indicadores</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-3">
              <div className="border-l-2 border-indigo-500 pl-4">
                <p className="text-white text-sm font-semibold">Métricas de Tonelagem (TON)</p>
                <p className="text-xs mt-1 leading-relaxed">Pedidos com status <span className="text-indigo-400">"Implantado"</span> vs Notas Fiscais emitidas. Essencial para controle de metas de produção.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border-l-2 border-emerald-500 pl-4">
                <p className="text-white text-sm font-semibold">Ciclo de Comissões</p>
                <p className="text-xs mt-1 leading-relaxed">O <span className="text-emerald-400">Saldo a Receber</span> contempla todas as comissões pendentes globalmente, enquanto a <span className="text-emerald-400">Comissão Mensal</span> foca apenas no mês corrente.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;