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
    total_pedidos: 0,
    pedidos_implantados: 0,
    notas_fiscais_mes: 0,
    vencimentos_pendentes: 0
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
      title: 'Comissão Prevista',
      value: formatCurrency(stats.comissao_prevista),
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-800',
      iconBg: 'bg-blue-500',
      description: 'Pedidos implantados'
    },
    {
      title: 'Comissão Realizada',
      value: formatCurrency(stats.comissao_realizada),
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      iconBg: 'bg-green-500',
      description: 'Vencimentos pagos'
    },
    {
      title: 'Total de Pedidos',
      value: stats.total_pedidos,
      icon: FileText,
      color: 'bg-slate-100 text-slate-800',
      iconBg: 'bg-slate-500',
      description: 'Todos os pedidos'
    },
    {
      title: 'Pedidos Implantados',
      value: stats.pedidos_implantados,
      icon: TrendingDown,
      color: 'bg-blue-100 text-blue-800',
      iconBg: 'bg-blue-500',
      description: 'Aguardando faturamento'
    },
    {
      title: 'Notas Fiscais',
      value: stats.notas_fiscais_mes,
      icon: Receipt,
      color: 'bg-purple-100 text-purple-800',
      iconBg: 'bg-purple-500',
      description: 'Total emitidas'
    },
    {
      title: 'Vencimentos Pendentes',
      value: stats.vencimentos_pendentes,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      iconBg: 'bg-yellow-500',
      description: 'Aguardando pagamento'
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
        <Card className="p-6 border border-blue-200 bg-blue-50" data-testid="comissao-prevista-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Comissão Prevista</p>
              <h3 className="text-4xl font-bold text-blue-900 mt-2 font-mono">
                {formatCurrency(stats.comissao_prevista)}
              </h3>
              <p className="text-sm text-blue-700 mt-2">Pedidos implantados aguardando faturamento</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
              <TrendingUp size={32} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-green-200 bg-green-50" data-testid="comissao-realizada-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Comissão Realizada</p>
              <h3 className="text-4xl font-bold text-green-900 mt-2 font-mono">
                {formatCurrency(stats.comissao_realizada)}
              </h3>
              <p className="text-sm text-green-700 mt-2">Vencimentos pagos até o momento</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <DollarSign size={32} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(2).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow" data-testid={`stat-card-${index}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono">{stat.value}</h3>
                  <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-md ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={24} className="text-white" strokeWidth={2} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="mt-6 p-6 bg-slate-50 border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Karla, sans-serif' }}>
          Sobre o Cockpit de Comissões
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-blue-700 mb-1">• Comissão Prevista</p>
            <p className="text-slate-600">Calculada automaticamente sobre pedidos com status "Implantado", baseada no segmento do material e porcentagem de comissão configurada.</p>
          </div>
          <div>
            <p className="font-medium text-green-700 mb-1">• Comissão Realizada</p>
            <p className="text-slate-600">Soma das comissões de vencimentos com status "Pago". Atualizada conforme parcelas são liquidadas.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;