import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, FileText, DollarSign, Receipt, Clock,
  BarChart3, Calendar, Target, ChevronRight, Weight,
  Lock, Package, Users, RefreshCw, ChevronDown, AlertTriangle,
  CheckCircle, Zap, ClipboardList, BarChart2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────
const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const num = (v, c = 1) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);
const fmtDate = (d) => { if (!d) return '---'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
const getDiaSemana = (d) => { if (!d) return ''; return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(d + 'T00:00:00').getDay()]; };

const getSemanaAtual = () => {
  const hoje = new Date();
  const domingo = new Date(hoje); domingo.setDate(hoje.getDate() - hoje.getDay());
  const sabado = new Date(domingo); sabado.setDate(domingo.getDate() + 6);
  const toStr = (d) => d.toISOString().split('T')[0];
  return { inicio: toStr(domingo), fim: toStr(sabado), hoje: toStr(hoje) };
};

const STATUS_CFG = {
  PENDENTE:   { cls: 'bg-amber-100 text-amber-800 border-amber-300',   label: 'Pendente' },
  IMPLANTADO: { cls: 'bg-blue-100 text-blue-800 border-blue-300',      label: 'Implantado' },
  NF_EMITIDA: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'NF Emitida' },
  ATRASADO:   { cls: 'bg-red-100 text-red-700 border-red-300',         label: 'Atrasado' },
  CANCELADO:  { cls: 'bg-slate-100 text-slate-500 border-slate-300',   label: 'Cancelado' },
};

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diasAbertos, setDiasAbertos] = useState({});

  const [todasNotas, setTodasNotas] = useState([]);

  const semana = getSemanaAtual();

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  const getStatusReal = (p) => {
    if (p.status === 'NF_EMITIDA' || p.status === 'CANCELADO') return p.status;
    if (p.data_entrega) {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const entrega = new Date(p.data_entrega + 'T00:00:00');
      if (entrega < hoje) return 'ATRASADO';
    }
    return p.status;
  };

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [statsRes, metasRes, pedidosRes, notasRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/metas'),
        api.get('/pedidos'),
        api.get('/notas-fiscais'),
      ]);
      setStats(statsRes.data);
      setTodasNotas(notasRes.data || []);

      const mesAtual = (new Date().getMonth() + 1).toString();
      const totalMeta = (metasRes.data || []).filter(m => m.mes === mesAtual).reduce((a, m) => a + parseFloat(m.valor_ton || 0), 0);
      setMetaGlobal(totalMeta);

      const todos = (pedidosRes.data || []).map(p => ({ ...p, statusReal: getStatusReal(p) }));
      setTodosPedidos(todos);

      const semanaFiltrados = todos.filter(p => {
        if (!p.data_entrega) return false;
        const dataEntrega = p.data_entrega.substring(0, 10);
        return dataEntrega >= semana.inicio && dataEntrega <= semana.fim && p.status !== 'CANCELADO' && p.status !== 'NF_EMITIDA';
      }).sort((a, b) => a.data_entrega?.localeCompare(b.data_entrega));
      setPedidosSemana(semanaFiltrados);

      // Abrir dia de hoje por padrão
      setDiasAbertos({ [semana.hoje]: true });

    } catch { toast.error('Erro ao sincronizar indicadores'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const toggleDia = (dia) => setDiasAbertos(prev => ({ ...prev, [dia]: !prev[dia] }));

  const porcentagemMeta = metaGlobal > 0 ? (stats.tonelagem_faturada / metaGlobal) * 100 : 0;

  // Faturamento mensal para o gráfico — usa data_emissao das NFs
  const faturamentoPorMes = () => {
    const anoAtual = new Date().getFullYear();
    const arr = Array(12).fill(0);
    todasNotas.forEach(n => {
      const dataRef = n.data_emissao;
      if (!dataRef) return;
      const ano = dataRef.substring(0,4);
      if (ano === String(anoAtual)) {
        const mes = parseInt(dataRef.substring(5,7)) - 1;
        if (mes >= 0 && mes < 12) arr[mes] += n.valor_total || 0;
      }
    });
    return MESES.map((m,i) => ({ mes: m, valor: arr[i] }));
  };

  // Pedidos atrasados
  const atrasados = todosPedidos.filter(p => p.statusReal === 'ATRASADO');

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando indicadores...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              <Lock size={11} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400">Somente Leitura</span>
            </div>
          )}
          <button onClick={() => loadAll(true)} disabled={refreshing}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg hover:border-[#0A3D73] hover:text-[#0A3D73] transition-all shadow-sm">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* ── ALERTA ATRASADOS ── */}
      {atrasados.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-red-700">{atrasados.length} pedido{atrasados.length > 1 ? 's' : ''} em atraso</p>
              <p className="text-xs text-red-500 mt-0.5">Prazo de entrega vencido sem NF emitida</p>
            </div>
          </div>
          <button onClick={() => navigate('/pedidos')}
            className="flex items-center gap-1.5 text-xs font-black text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
            Ver pedidos <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* ── KPIs PRINCIPAIS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Faturado no Mês',   value: brl(stats.faturado_mes_valor),           icon: Receipt,    cor: '#166534', fundo: '#DCFCE7' },
          { label: 'Comissão Realizada', value: brl(stats.comissao_realizada),           icon: DollarSign, cor: '#0A3D73', fundo: '#DBEAFE' },
          { label: 'A Receber',          value: brl(stats.comissoes_a_receber),          icon: TrendingUp, cor: '#92400E', fundo: '#FEF3C7' },
          { label: 'Pedidos em Aberto',  value: `${todosPedidos.filter(p => ['PENDENTE','IMPLANTADO'].includes(p.status)).length}`, icon: FileText, cor: '#1E40AF', fundo: '#EFF6FF' },
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: k.fundo}}>
                <k.icon size={15} style={{color: k.cor}} />
              </div>
            </div>
            <p className="text-xl font-black" style={{color: k.cor}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── META + GRÁFICO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* META */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Meta Mensal</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">Tonelagem Faturada</p>
            </div>
            <Target size={20} className="text-slate-300" />
          </div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-black text-[#0A3D73]">{num(stats.tonelagem_faturada)}</span>
              <span className="text-xs font-bold text-slate-400 ml-1">/ {num(metaGlobal)} TON</span>
            </div>
            <span className={`text-lg font-black ${porcentagemMeta >= 100 ? 'text-green-600' : 'text-[#0A3D73]'}`}>
              {num(porcentagemMeta)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 rounded-full ${porcentagemMeta >= 100 ? 'bg-green-500' : 'bg-[#0A3D73]'}`}
              style={{ width: `${Math.min(porcentagemMeta, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-slate-400">{num(stats.tonelagem_faturada, 3)} TON faturadas</p>
            <p className="text-xs text-slate-400">Meta: {num(metaGlobal)} TON</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-semibold">Carteira implantada</span>
              <span className="font-black text-slate-700">{num(stats.tonelagem_implantada, 3)} TON</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-semibold">Comissão prevista</span>
              <span className="font-black text-slate-700">{brl(stats.comissao_prevista)}</span>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => navigate('/metas')}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-[#0A3D73] hover:text-white transition-all text-xs font-black rounded-lg border border-slate-200 flex items-center justify-center gap-1.5">
              Ver metas por cliente <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Faturamento Mensal</p>
          <p className="text-sm font-black text-slate-800 mb-4">{new Date().getFullYear()}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={faturamentoPorMes()} margin={{top:0,right:10,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="mes" tick={{fontSize:11, fontWeight:700}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => brl(v)} labelStyle={{fontWeight:700}} />
              <Bar dataKey="valor" fill="#0A3D73" radius={[4,4,0,0]} name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── PAINEL DA SEMANA (ACORDEÃO) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-[#0A3D73]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Painel da Semana</p>
              <p className="text-xs text-slate-400">{fmtDate(semana.inicio)} a {fmtDate(semana.fim)} · Entregas previstas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold">{pedidosSemana.length} pedidos</p>
            </div>
            <button onClick={() => navigate('/pedidos')}
              className="flex items-center gap-1 text-xs font-black text-[#0A3D73] border border-[#0A3D73]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A3D73] hover:text-white transition-colors">
              Ver todos <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Dias em acordeão */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(semana.inicio + 'T00:00:00');
            d.setDate(d.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const isHoje = dStr === semana.hoje;
            const pedidosDia = pedidosSemana.filter(p => p.data_entrega?.substring(0,10) === dStr);
            const aberto = diasAbertos[dStr];

            return (
              <div key={dStr}>
                {/* Linha do dia — clicável */}
                <button
                  onClick={() => pedidosDia.length > 0 && toggleDia(dStr)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left
                    ${isHoje ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}
                    ${pedidosDia.length === 0 ? 'cursor-default opacity-50' : 'cursor-pointer'}
                  `}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 text-center flex-shrink-0`}>
                      <p className={`text-xs font-black uppercase ${isHoje ? 'text-[#0A3D73]' : 'text-slate-400'}`}>{DIAS[d.getDay()]}</p>
                      <p className={`text-sm font-black ${isHoje ? 'text-[#0A3D73]' : 'text-slate-600'}`}>{String(d.getDate()).padStart(2,'0')}</p>
                    </div>
                    {isHoje && <span className="text-xs font-black text-[#0A3D73] bg-blue-100 px-2 py-0.5 rounded-full">Hoje</span>}
                    {pedidosDia.length === 0 && <span className="text-xs text-slate-400">Sem entregas</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {pedidosDia.length > 0 && (
                      <>
                        <span className="text-xs font-black text-white bg-[#0A3D73] w-6 h-6 rounded-full flex items-center justify-center">{pedidosDia.length}</span>
                        {/* mini status badges */}
                        <div className="hidden md:flex gap-1">
                          {Object.entries(pedidosDia.reduce((a,p) => { const s = p.statusReal||p.status; a[s]=(a[s]||0)+1; return a; }, {})).map(([s,q]) => (
                            <span key={s} className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${STATUS_CFG[s]?.cls || ''}`}>{q} {s}</span>
                          ))}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </div>
                </button>

                {/* Pedidos do dia expandidos */}
                {aberto && pedidosDia.length > 0 && (
                  <div className="bg-slate-50 border-t border-slate-100">
                    {pedidosDia.map((p, idx) => {
                      const statusReal = p.statusReal || p.status;
                      const cfg = STATUS_CFG[statusReal] || STATUS_CFG.PENDENTE;
                      return (
                        <div key={p.id || idx}
                          onClick={() => navigate('/pedidos')}
                          className="flex items-center gap-3 px-5 py-2.5 hover:bg-white cursor-pointer transition-colors border-b border-slate-100 last:border-0 text-xs">
                          <div className="w-16 flex-shrink-0">
                            <p className="text-slate-400 font-bold text-[10px] uppercase">FE</p>
                            <p className="font-black text-[#0A3D73] font-mono truncate">{p.numero_fe || '---'}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-400 font-bold text-[10px] uppercase">Produto</p>
                            <p className="font-bold text-slate-700 truncate">{p.item_nome || '---'}</p>
                          </div>
                          <div className="w-28 flex-shrink-0 hidden sm:block">
                            <p className="text-slate-400 font-bold text-[10px] uppercase">Cliente</p>
                            <p className="font-black text-slate-800 truncate">{p.cliente_nome?.split(' ')[0] || '---'}</p>
                          </div>
                          <div className="w-20 flex-shrink-0 hidden md:block">
                            <p className="text-slate-400 font-bold text-[10px] uppercase">Valor</p>
                            <p className="font-black text-slate-700">{brl(p.valor_total)}</p>
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-black border rounded-full ${cfg.cls}`}>{cfg.label}</span>
                          <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ATALHOS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pedidos',     icon: FileText,      link: '/pedidos' },
          { label: 'Orçamentos',  icon: ClipboardList, link: '/orcamentos' },
          { label: 'Relatórios',  icon: BarChart2,     link: '/relatorios' },
          { label: 'Comissões',   icon: DollarSign,    link: '/comissoes' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.link)}
            className="flex items-center justify-between gap-2 p-3.5 bg-white border border-slate-200 text-xs font-black uppercase tracking-wide text-slate-600 rounded-xl hover:bg-[#0A3D73] hover:text-white hover:border-[#0A3D73] transition-all shadow-sm group">
            <div className="flex items-center gap-2">
              <item.icon size={14} className="flex-shrink-0" />
              {item.label}
            </div>
            <ChevronRight size={11} className="text-slate-300 group-hover:text-white" />
          </button>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;