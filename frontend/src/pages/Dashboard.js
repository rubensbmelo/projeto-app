import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { TrendingUp, TrendingDown, FileText, DollarSign, Receipt, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statCards = [
    {
      title: 'Pedidos do Mês',
      value: formatCurrency(stats.pedidos_mes_valor),
      icon: FileText,
      color: 'text-slate-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      description: 'Valor total de pedidos criados no mês'
    },
    {
      title: 'Faturado no Mês',
      value: formatCurrency(stats.faturado_mes_valor),
      icon: Receipt,
      color: 'text-slate-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      description: 'Valor de notas fiscais emitidas no mês'
    },
    {
      title: 'Comissão do Mês',
      value: formatCurrency(stats.comissao_mes),
      icon: DollarSign,
      color: 'text-slate-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'Comissões com vencimento no mês atual'
    },
    {
      title: 'Comissões a Receber',
      value: formatCurrency(stats.comissoes_a_receber),
      icon: Clock,
      color: 'text-slate-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'Total de comissões pendentes (global)'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Karla, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1">Visão geral do sistema de gestão</p>
      </div>

      {/* Cockpit de Comissões - Destaque Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 border border-blue-200 bg-blue-50" data-testid="tonelagem-implantada-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Pedidos Implantados (TON)</p>
              <h3 className="text-5xl font-bold text-blue-900 mt-2 font-mono">
                {stats.tonelagem_implantada.toFixed(3)} TON
              </h3>
              <p className="text-sm text-blue-700 mt-3 font-medium">
                Comissão Prevista: {formatCurrency(stats.comissao_prevista)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Peso total de pedidos implantados no mês atual
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
              <TrendingUp size={32} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-green-200 bg-green-50" data-testid="tonelagem-faturada-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Pedidos Faturados (TON)</p>
              <h3 className="text-5xl font-bold text-green-900 mt-2 font-mono">
                {stats.tonelagem_faturada.toFixed(3)} TON
              </h3>
              <p className="text-sm text-green-700 mt-3 font-medium">
                Comissão Realizada: {formatCurrency(stats.comissao_realizada)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Peso total de notas fiscais emitidas no mês
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <DollarSign size={32} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid de Estatísticas - Design Clean Enterprise */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className={`p-5 ${stat.bgColor} border ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}
              data-testid={`stat-card-${index}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                    {stat.title}
                  </p>
                  <h3 className={`text-2xl font-bold ${stat.color} font-mono`}>
                    {stat.value}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    {stat.description}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-md ${stat.iconBg} flex items-center justify-center flex-shrink-0 ml-3`}>
                  <Icon size={20} className={stat.iconColor} strokeWidth={2} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="mt-6 p-6 bg-slate-50 border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Karla, sans-serif' }}>
          Sobre as Métricas de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-blue-700 mb-1">• Pedidos Implantados (TON)</p>
            <p className="text-slate-600">Soma do peso total (em toneladas) de todos os pedidos com status "Implantado" no mês atual. Conversão automática: KG ÷ 1000 = TON. A comissão prevista é calculada sobre o valor faturado baseado no segmento do material.</p>
          </div>
          <div>
            <p className="font-medium text-green-700 mb-1">• Pedidos Faturados (TON)</p>
            <p className="text-slate-600">Soma do peso (em toneladas) das Notas Fiscais emitidas no mês atual. A comissão realizada representa a soma das comissões de vencimentos já pagos, independente do mês de emissão.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;