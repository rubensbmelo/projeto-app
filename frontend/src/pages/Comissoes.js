import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FileDown, DollarSign, Clock, AlertCircle, TrendingUp, Lock, CheckCircle2, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

const fmtDate = (d) => {
  if (!d) return '---';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
};

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_CFG = {
  Pago:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'PAGO' },
  Pendente: { cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500',    label: 'PENDENTE' },
  Atrasado: { cls: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500',     label: 'ATRASADO' },
};

const Comissoes = () => {
  const { isAdmin } = useAuth();
  const [vencimentos, setVencimentos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [selectedMonth, setSelectedMonth] = useState('TODOS');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vencRes, notasRes, pedidosRes] = await Promise.all([
        api.get('/vencimentos'),
        api.get('/notas-fiscais'),
        api.get('/pedidos'),
      ]);
      setVencimentos(vencRes.data || []);
      setNotas(notasRes.data || []);
      setPedidos(pedidosRes.data || []);
    } catch { toast.error('Erro ao carregar relatório financeiro'); }
    finally { setLoading(false); }
  };

  const handleMarcarPago = async (vencId) => {
    if (!isAdmin) return;
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await api.put(`/vencimentos/${vencId}`, { status: 'Pago', data_pagamento: hoje });
      toast.success('Pagamento confirmado!');
      fetchData();
    } catch { toast.error('Erro ao confirmar pagamento'); }
  };

  const handleExportExcel = async () => {
    if (!isAdmin) return toast.error('Acesso restrito');
    try {
      const response = await api.get('/export/comissoes', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comissoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel gerado!');
    } catch { toast.error('Erro ao gerar Excel'); }
  };

  const getNota = (notaId) => notas.find(n => n.id === notaId);

  // Enriquece vencimentos com dados da nota
  const vencimentosEnriquecidos = useMemo(() =>
    vencimentos.map(v => {
      const nota = notas.find(n => n.id === v.nota_fiscal_id);
      return { ...v, nota, cliente_nome: v.cliente_nome || nota?.cliente_nome || 'N/A', numero_nf: v.numero_nf || nota?.numero_nf };
    }), [vencimentos, notas]
  );

  // Filtros
  const vencimentosFiltrados = useMemo(() => {
    return vencimentosEnriquecidos.filter(v => {
      const matchStatus = filterStatus === 'TODOS' || v.status === filterStatus;
      const matchMes = selectedMonth === 'TODOS' ||
        (v.data_vencimento && (new Date(v.data_vencimento + 'T00:00:00').getMonth() + 1).toString() === selectedMonth);
      const s = searchTerm.toLowerCase();
      const matchSearch = !s ||
        v.numero_nf?.toLowerCase().includes(s) ||
        v.cliente_nome?.toLowerCase().includes(s) ||
        v.nota?.numero_fabrica?.toLowerCase().includes(s);
      return matchStatus && matchMes && matchSearch;
    });
  }, [vencimentosEnriquecidos, filterStatus, selectedMonth, searchTerm]);

  // Totalizadores
  const totalPago     = vencimentos.filter(v => v.status === 'Pago').reduce((a, v) => a + (v.comissao_calculada || 0), 0);
  const totalPendente = vencimentos.filter(v => v.status === 'Pendente').reduce((a, v) => a + (v.comissao_calculada || 0), 0);
  const totalAtrasado = vencimentos.filter(v => v.status === 'Atrasado').reduce((a, v) => a + (v.comissao_calculada || 0), 0);
  const totalGeral    = totalPago + totalPendente + totalAtrasado;

  const contadores = {
    TODOS: vencimentos.length,
    Pendente: vencimentos.filter(v => v.status === 'Pendente').length,
    Atrasado: vencimentos.filter(v => v.status === 'Atrasado').length,
    Pago:     vencimentos.filter(v => v.status === 'Pago').length,
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Comissões...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Relatório de Comissões
            {!isAdmin && <Lock size={14} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Consolidado Financeiro · {vencimentos.length} vencimentos
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="NF, cliente..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-36"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button
              onClick={handleExportExcel}
              className="bg-[#107C41] hover:bg-[#0A5D31] text-white rounded-none px-5 font-black text-[10px] uppercase h-9 tracking-widest"
            >
              <FileDown size={13} className="mr-1.5" /> Exportar Excel
            </Button>
          )}
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Comissões',   value: `R$ ${fmt(totalGeral)}`,   icon: DollarSign,   color: 'text-slate-700',   bg: 'bg-white border-slate-200',      border: 'border-l-4 border-l-slate-400' },
          { label: 'Recebido (Pago)',   value: `R$ ${fmt(totalPago)}`,     icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', border: 'border-l-4 border-l-emerald-500' },
          { label: 'A Receber',         value: `R$ ${fmt(totalPendente)}`, icon: Clock,        color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',        border: 'border-l-4 border-l-blue-500' },
          { label: 'Atrasado',          value: `R$ ${fmt(totalAtrasado)}`, icon: AlertCircle,  color: 'text-red-700',     bg: totalAtrasado > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200', border: totalAtrasado > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-slate-200' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 border ${item.bg} ${item.border}`}>
            <item.icon size={18} className={item.color} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{item.label}</p>
              <p className={`text-sm font-black ${item.color} font-mono mt-0.5`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Status */}
        <div className="flex gap-1">
          {[
            { k: 'TODOS',    label: 'Todos' },
            { k: 'Pendente', label: 'Pendente' },
            { k: 'Atrasado', label: 'Atrasado' },
            { k: 'Pago',     label: 'Pago' },
          ].map(s => (
            <button
              key={s.k}
              onClick={() => setFilterStatus(s.k)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border transition-all ${
                filterStatus === s.k
                  ? 'bg-[#0A3D73] text-white border-[#0A3D73]'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-[#0A3D73]'
              }`}
            >
              {s.label} ({contadores[s.k] || 0})
            </button>
          ))}
        </div>

        {/* Mês */}
        <div className="flex items-center gap-1">
          <Calendar size={12} className="text-slate-400" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-[10px] font-black uppercase bg-white border border-slate-300 h-8 px-2 outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os meses</option>
            {MESES.map((m, i) => (
              <option key={m} value={(i+1).toString()}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABELA — FLUXO FUTURO */}
      <Card className="rounded-none border border-slate-300 shadow-xl overflow-hidden mb-4">
        <div className="p-3 bg-[#0A3D73] text-white flex items-center justify-between">
          <h3 className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp size={14} /> Fluxo de Comissões
          </h3>
          <span className="text-[9px] font-bold text-blue-300">{vencimentosFiltrados.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 border-r border-slate-100">NF</th>
                <th className="px-4 py-3 border-r border-slate-100">Cliente</th>
                <th className="px-4 py-3 border-r border-slate-100 text-center">Parcela</th>
                <th className="px-4 py-3 border-r border-slate-100">Vencimento</th>
                <th className="px-4 py-3 border-r border-slate-100 text-right">Comissão R$</th>
                <th className="px-4 py-3 border-r border-slate-100 text-center">Status</th>
                <th className="px-4 py-3">Data Pgto</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ação</th>}
              </tr>
            </thead>
            <tbody>
              {vencimentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <DollarSign size={28} className="mx-auto mb-3 opacity-20" />
                    Nenhuma comissão encontrada
                  </td>
                </tr>
              ) : vencimentosFiltrados.map((v, idx) => {
                const cfg = STATUS_CFG[v.status] || STATUS_CFG.Pendente;
                return (
                  <tr
                    key={v.id}
                    className={`text-[11px] border-b border-slate-100 transition-colors hover:bg-blue-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } ${v.status === 'Atrasado' ? 'border-l-2 border-l-red-400' : ''}`}
                  >
                    <td className="px-4 py-2.5 border-r border-slate-100 font-mono font-black text-blue-800 whitespace-nowrap">
                      NF {v.numero_nf}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 font-bold uppercase max-w-[160px] truncate">
                      {v.cliente_nome}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center font-black text-slate-500">
                      {v.parcela}ª/{v.total_parcelas}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 font-bold whitespace-nowrap">
                      {fmtDate(v.data_vencimento)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-right font-black text-emerald-700 whitespace-nowrap">
                      R$ {fmt(v.comissao_calculada)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                      <span className={`flex items-center justify-center gap-1 px-2 py-0.5 text-[9px] font-black border w-fit mx-auto ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-slate-100 text-[10px] font-bold text-slate-400">
                      {v.data_pagamento ? fmtDate(v.data_pagamento) : '---'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center">
                        {v.status !== 'Pago' ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarcarPago(v.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-[9px] font-black uppercase h-7 px-3"
                          >
                            <CheckCircle2 size={10} className="mr-1" /> Confirmar
                          </Button>
                        ) : (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {/* RODAPÉ TOTALIZADOR */}
            {vencimentosFiltrados.length > 0 && (
              <tfoot>
                <tr className="bg-[#0A3D73] text-white text-[10px] font-black">
                  <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-widest">
                    Total ({vencimentosFiltrados.length} venc.):
                  </td>
                  <td className="px-4 py-2.5 text-right font-black font-mono">
                    R$ {fmt(vencimentosFiltrados.reduce((a, v) => a + (v.comissao_calculada || 0), 0))}
                  </td>
                  <td colSpan={isAdmin ? 3 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Comissoes;