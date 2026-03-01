import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import {
  TrendingUp, FileText, DollarSign, Receipt, Clock,
  BarChart3, Calendar, Target, ChevronRight, Weight,
  Lock, Package, Users, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtNum = (v, c = 1) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);

const fmtDate = (d) => {
  if (!d) return '---';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const getDiaSemana = (d) => {
  if (!d) return '';
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dias[new Date(d + 'T00:00:00').getDay()];
};

// Retorna domingo e sábado da semana atual
const getSemanaAtual = () => {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom, 6=Sáb
  const domingo = new Date(hoje);
  domingo.setDate(hoje.getDate() - diaSemana);
  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);
  const toStr = (d) => d.toISOString().split('T')[0];
  return { inicio: toStr(domingo), fim: toStr(sabado), hoje: toStr(hoje) };
};

const STATUS_CFG = {
  PENDENTE:   { cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  IMPLANTADO: { cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  NF_EMITIDA: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELADO:  { cls: 'bg-red-100 text-red-700 border-red-300' },
};

// ── Componente ────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState({
    tonelagem_implantada: 0, comissao_prevista: 0,
    tonelagem_faturada: 0,   comissao_realizada: 0,
    pedidos_mes_valor: 0,    faturado_mes_valor: 0,
    comissao_mes: 0,         comissoes_a_receber: 0,
  });
  const [metaGlobal, setMetaGlobal] = useState(0);
  const [pedidosSemana, setPedidosSemana] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const semana = getSemanaAtual();

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, metasRes, pedidosRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/metas'),
        api.get('/pedidos'),
      ]);

      setStats(statsRes.data);

      // Meta do mês atual
      const mesAtual = (new Date().getMonth() + 1).toString();
      const totalMeta = (metasRes.data || [])
        .filter(m => m.mes === mesAtual)
        .reduce((acc, m) => acc + parseFloat(m.valor_ton || 0), 0);
      setMetaGlobal(totalMeta);

      // Pedidos da semana — entrega entre domingo e sábado, excluir CANCELADO e NF_EMITIDA
      const semanaFiltrados = (pedidosRes.data || []).filter(p => {
        if (!p.data_entrega) return false;
        const dataEntrega = p.data_entrega.substring(0, 10);
        const statusValido = p.status !== 'CANCELADO' && p.status !== 'NF_EMITIDA';
        return dataEntrega >= semana.inicio && dataEntrega <= semana.fim && statusValido;
      });
      // Ordena por data de entrega
      semanaFiltrados.sort((a, b) => a.data_entrega?.localeCompare(b.data_entrega));
      setPedidosSemana(semanaFiltrados);

    } catch { toast.error('Erro ao sincronizar indicadores'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const porcentagemMeta = metaGlobal > 0 ? (stats.tonelagem_faturada / metaGlobal) * 100 : 0;

  // Label da semana
  const labelSemana = `${fmtDate(semana.inicio)} a ${fmtDate(semana.fim)}`;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando indicadores...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <BarChart3 size={11} className="text-[#0A3D73]" />
            Inteligência Operacional · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 bg-slate-200 px-3 py-1.5 border border-slate-300">
              <Lock size={11} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Somente Leitura</span>
            </div>
          )}
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600 hover:border-[#0A3D73] hover:text-[#0A3D73] transition-all"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* ── PAINEL DA SEMANA ── */}
      <div className="mb-5">
        <Card className="rounded-none border border-slate-300 shadow-xl overflow-hidden bg-white">
          {/* Header do painel */}
          <div className="px-4 py-3 bg-[#0A3D73] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-300" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Painel da Semana</p>
                <p className="text-[9px] text-blue-300 font-bold mt-0.5">{labelSemana} · Entregas previstas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] text-blue-300 font-bold uppercase">Pedidos</p>
                <p className="text-lg font-black font-mono">{pedidosSemana.length}</p>
              </div>
              <button
                onClick={() => navigate('/pedidos')}
                className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-300 hover:text-white transition-colors border border-blue-600 hover:border-white px-2 py-1"
              >
                Ver todos <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Dias da semana como sub-header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(semana.inicio + 'T00:00:00');
              d.setDate(d.getDate() + i);
              const str = d.toISOString().split('T')[0];
              const isHoje = str === semana.hoje;
              const qtd = pedidosSemana.filter(p => p.data_entrega?.substring(0, 10) === str).length;
              const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
              return (
                <div key={i} className={`text-center py-2 border-r border-slate-200 last:border-r-0 ${isHoje ? 'bg-[#0A3D73]/10' : ''}`}>
                  <p className={`text-[9px] font-black uppercase ${isHoje ? 'text-[#0A3D73]' : 'text-slate-400'}`}>{dias[d.getDay()]}</p>
                  <p className={`text-[10px] font-black ${isHoje ? 'text-[#0A3D73]' : 'text-slate-600'}`}>{String(d.getDate()).padStart(2, '0')}</p>
                  {qtd > 0 && (
                    <span className="inline-block mt-0.5 w-4 h-4 bg-[#0A3D73] text-white text-[8px] font-black rounded-full leading-4">
                      {qtd}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lista de pedidos */}
          {pedidosSemana.length === 0 ? (
            <div className="py-10 text-center">
              <Package size={28} className="mx-auto mb-2 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma entrega prevista para esta semana</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pedidosSemana.map((p, idx) => {
                const dataStr = p.data_entrega?.substring(0, 10) || '';
                const isHoje = dataStr === semana.hoje;
                const cfg = STATUS_CFG[p.status] || STATUS_CFG.PENDENTE;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate('/pedidos')}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-[11px] ${
                      isHoje ? 'bg-blue-50/60 hover:bg-blue-100/60' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Data */}
                    <div className={`w-12 text-center shrink-0 ${isHoje ? 'text-[#0A3D73]' : 'text-slate-400'}`}>
                      <p className="text-[9px] font-black uppercase">{getDiaSemana(dataStr)}</p>
                      <p className="text-[12px] font-black font-mono">{fmtDate(dataStr)}</p>
                    </div>

                    {/* Divider */}
                    <div className={`w-0.5 h-8 shrink-0 ${isHoje ? 'bg-[#0A3D73]' : 'bg-slate-200'}`} />

                    {/* FE */}
                    <div className="w-20 shrink-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase">FE</p>
                      <p className="font-black text-blue-700 font-mono text-[11px] truncate">{p.numero_fe || '---'}</p>
                    </div>

                    {/* Item */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Produto</p>
                      <p className="font-bold text-slate-700 uppercase truncate text-[11px]">{p.item_nome || '---'}</p>
                    </div>

                    {/* Cliente */}
                    <div className="w-28 shrink-0 hidden sm:block">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Cliente</p>
                      <p className="font-black text-slate-800 uppercase truncate text-[11px]">{p.cliente_nome?.split(' ')[0] || '---'}</p>
                    </div>

                    {/* Status */}
                    <span className={`shrink-0 px-2 py-0.5 text-[9px] font-black border whitespace-nowrap ${cfg.cls}`}>
                      {p.status}
                    </span>

                    {isHoje && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0A3D73] animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── SEÇÃO KPIs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* META MENSAL */}
        <Card className="lg:col-span-2 p-5 bg-white rounded-none border border-slate-300 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso · Meta Mensal</p>
              <h2 className="text-base font-black text-[#0A3D73] uppercase mt-0.5">Tonelagem Faturada</h2>
            </div>
            <Target size={22} className="text-slate-200" />
          </div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-black text-slate-900 font-mono">{fmtNum(stats.tonelagem_faturada)}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">/ {fmtNum(metaGlobal)} TON</span>
            </div>
            <span className={`text-base font-black ${porcentagemMeta >= 100 ? 'text-emerald-600' : 'text-[#0A3D73]'}`}>
              {fmtNum(porcentagemMeta)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${porcentagemMeta >= 100 ? 'bg-emerald-500' : 'bg-[#0A3D73]'}`}
              style={{ width: `${Math.min(porcentagemMeta, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-[8px] text-slate-400 font-bold">{fmtNum(stats.tonelagem_faturada, 3)} TON faturadas</p>
            <p className="text-[8px] text-slate-400 font-bold">{fmtNum(metaGlobal)} TON de meta</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/metas')}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-[#0A3D73] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border border-slate-200"
            >
              Ver detalhamento por cliente <ChevronRight size={11} />
            </button>
          )}
        </Card>

        {/* COMISSÃO */}
        <Card className="p-5 bg-[#0A3D73] text-white rounded-none border-none shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <DollarSign size={20} className="text-blue-300" />
              <span className="bg-white/10 text-[9px] px-2 py-0.5 font-black uppercase text-blue-200">Financeiro</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Comissão Realizada</p>
            <h2 className="text-2xl font-black mt-1 font-mono">{fmtBRL(stats.comissao_realizada)}</h2>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 space-y-1">
            <div className="flex justify-between">
              <p className="text-[9px] font-bold uppercase opacity-50">Prevista (Implantado)</p>
              <p className="text-[10px] font-black opacity-80 font-mono">{fmtBRL(stats.comissao_prevista)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-[9px] font-bold uppercase opacity-50">A Receber</p>
              <p className="text-[10px] font-black text-blue-200 font-mono">{fmtBRL(stats.comissoes_a_receber)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── MINI KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Carteira (TON)',   value: `${fmtNum(stats.tonelagem_implantada, 3)} TON`, icon: Weight,   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      link: '/pedidos' },
          { label: 'Faturamento Mês', value: fmtBRL(stats.faturado_mes_valor),               icon: Receipt,  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', link: '/notas-fiscais' },
          { label: 'Venda Bruta Mês', value: fmtBRL(stats.pedidos_mes_valor),                icon: FileText, color: 'text-slate-700',   bg: 'bg-white border-slate-200',        link: '/pedidos' },
          { label: 'Comissão Mês',    value: fmtBRL(stats.comissao_mes),                     icon: TrendingUp,color:'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     link: '/comissoes' },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(item.link)}
            className={`flex items-center gap-3 p-3 border ${item.bg} cursor-pointer hover:shadow-md transition-all group`}
          >
            <item.icon size={18} className={`${item.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider truncate">{item.label}</p>
              <p className={`text-sm font-black ${item.color} font-mono mt-0.5`}>{item.value}</p>
            </div>
            <ChevronRight size={11} className="text-slate-300 group-hover:text-slate-500 shrink-0 ml-auto" />
          </div>
        ))}
      </div>

      {/* ── ATALHOS RÁPIDOS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Novo Pedido',   icon: FileText, link: '/pedidos',       color: 'hover:bg-[#0A3D73] hover:text-white' },
          { label: 'Clientes',      icon: Users,    link: '/clientes',       color: 'hover:bg-[#0A3D73] hover:text-white' },
          { label: 'Materiais',     icon: Package,  link: '/materiais',      color: 'hover:bg-[#0A3D73] hover:text-white' },
          { label: 'Comissões',     icon: DollarSign,link: '/comissoes',     color: 'hover:bg-[#0A3D73] hover:text-white' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.link)}
            className={`flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 transition-all ${item.color} group`}
          >
            <item.icon size={13} className="shrink-0" />
            {item.label}
            <ChevronRight size={10} className="ml-auto text-slate-300 group-hover:text-current" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;