import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileDown, DollarSign, Clock, AlertCircle, TrendingUp, Lock, CheckCircle2, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtDate = (d) => { if (!d) return '---'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); };
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_CFG = {
  Pago:     { cls: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500', label: 'Pago' },
  Pendente: { cls: 'bg-blue-100 text-blue-700 border-blue-300',         dot: 'bg-blue-500',    label: 'Pendente' },
  Atrasado: { cls: 'bg-red-100 text-red-700 border-red-300',            dot: 'bg-red-500',     label: 'Atrasado' },
};

const Comissoes = () => {
  const { isAdmin } = useAuth();
  const [vencimentos, setVencimentos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [selectedMonth, setSelectedMonth] = useState('TODOS');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vencRes, notasRes] = await Promise.all([api.get('/vencimentos'), api.get('/notas-fiscais')]);
      setVencimentos(vencRes.data || []);
      setNotas(notasRes.data || []);
    } catch { toast.error('Erro ao carregar comissões'); }
    finally { setLoading(false); }
  };

  const handleMarcarPago = async (vencId) => {
    if (!isAdmin) return;
    try {
      await api.put(`/vencimentos/${vencId}`, { status: 'Pago', data_pagamento: new Date().toISOString().split('T')[0] });
      toast.success('Pagamento confirmado!');
      fetchData();
    } catch { toast.error('Erro ao confirmar pagamento'); }
  };

  const handleExportExcel = async () => {
    if (!isAdmin) return toast.error('Acesso restrito');
    try {
      const r = await api.get('/export/comissoes', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comissoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Excel gerado!');
    } catch { toast.error('Erro ao gerar Excel'); }
  };

  const vencimentosEnriquecidos = useMemo(() =>
    vencimentos.map(v => {
      const nota = notas.find(n => n.id === v.nota_fiscal_id);
      return { ...v, nota, cliente_nome: v.cliente_nome || nota?.cliente_nome || 'N/A', numero_nf: v.numero_nf || nota?.numero_nf };
    }), [vencimentos, notas]
  );

  const vencimentosFiltrados = useMemo(() => {
    return vencimentosEnriquecidos.filter(v => {
      const matchStatus = filterStatus === 'TODOS' || v.status === filterStatus;
      const matchMes = selectedMonth === 'TODOS' || (v.data_vencimento && (new Date(v.data_vencimento + 'T00:00:00').getMonth() + 1).toString() === selectedMonth);
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || v.numero_nf?.toLowerCase().includes(s) || v.cliente_nome?.toLowerCase().includes(s);
      return matchStatus && matchMes && matchSearch;
    });
  }, [vencimentosEnriquecidos, filterStatus, selectedMonth, searchTerm]);

  const totalPago     = vencimentos.filter(v => v.status === 'Pago').reduce((a,v) => a+(v.comissao_calculada||0), 0);
  const totalPendente = vencimentos.filter(v => v.status === 'Pendente').reduce((a,v) => a+(v.comissao_calculada||0), 0);
  const totalAtrasado = vencimentos.filter(v => v.status === 'Atrasado').reduce((a,v) => a+(v.comissao_calculada||0), 0);
  const totalGeral    = totalPago + totalPendente + totalAtrasado;

  const contadores = {
    TODOS: vencimentos.length,
    Pendente: vencimentos.filter(v => v.status === 'Pendente').length,
    Atrasado: vencimentos.filter(v => v.status === 'Atrasado').length,
    Pago:     vencimentos.filter(v => v.status === 'Pago').length,
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Comissões...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Comissões {!isAdmin && <Lock size={14} className="text-slate-400"/>}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Consolidado Financeiro · {vencimentos.length} vencimentos</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="NF, cliente..." className="text-xs font-semibold bg-transparent outline-none w-36 text-slate-700"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          {isAdmin && (
            <button onClick={handleExportExcel}
              className="flex items-center gap-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
              <FileDown size={13}/> Exportar Excel
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          {label:'Total Comissões',  value:`R$ ${fmt(totalGeral)}`,    icon:DollarSign,   cor:'#374151', fundo:'#F9FAFB'},
          {label:'Recebido (Pago)',  value:`R$ ${fmt(totalPago)}`,     icon:CheckCircle2, cor:'#166534', fundo:'#DCFCE7'},
          {label:'A Receber',        value:`R$ ${fmt(totalPendente)}`, icon:Clock,        cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Atrasado',         value:`R$ ${fmt(totalAtrasado)}`, icon:AlertCircle,  cor: totalAtrasado>0?'#991B1B':'#374151', fundo: totalAtrasado>0?'#FEE2E2':'#F9FAFB'},
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:k.fundo}}>
                <k.icon size={13} style={{color:k.cor}}/>
              </div>
            </div>
            <p className="text-lg font-black font-mono" style={{color:k.cor}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex gap-2 flex-wrap">
          {[{k:'TODOS',label:'Todos'},{k:'Pendente',label:'Pendente'},{k:'Atrasado',label:'Atrasado'},{k:'Pago',label:'Pago'}].map(s => (
            <button key={s.k} onClick={() => setFilterStatus(s.k)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filterStatus===s.k?'bg-[#0A3D73] text-white border-[#0A3D73] shadow-sm':'bg-white text-slate-600 border-slate-200 hover:border-[#0A3D73]'}`}>
              {s.label} <span className="opacity-60">({contadores[s.k]||0})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9 shadow-sm">
          <Calendar size={12} className="text-slate-400"/>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs font-bold bg-transparent outline-none cursor-pointer text-slate-700">
            <option value="TODOS">Todos os meses</option>
            {MESES.map((m,i) => <option key={m} value={(i+1).toString()}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-[#0A3D73]"/>
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Fluxo de Comissões</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">{vencimentosFiltrados.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-xs font-black uppercase tracking-wide">
                <th className="px-4 py-3">NF</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-center">Parcela</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Comissão R$</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Data Pgto</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ação</th>}
              </tr>
            </thead>
            <tbody>
              {vencimentosFiltrados.length === 0 ? (
                <tr><td colSpan={isAdmin?8:7} className="text-center py-16 text-slate-400">
                  <DollarSign size={32} className="mx-auto mb-3 opacity-20"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhuma comissão encontrada</p>
                </td></tr>
              ) : vencimentosFiltrados.map((v, idx) => {
                const cfg = STATUS_CFG[v.status] || STATUS_CFG.Pendente;
                return (
                  <tr key={v.id}
                    className={`text-xs border-b border-slate-100 transition-colors hover:bg-blue-50
                      ${idx%2===0?'bg-white':'bg-slate-50/60'}
                      ${v.status==='Atrasado'?'border-l-2 border-l-red-400':''}`}>
                    <td className="px-4 py-2.5 font-mono font-black text-[#0A3D73] whitespace-nowrap">NF {v.numero_nf}</td>
                    <td className="px-4 py-2.5 font-bold uppercase max-w-[160px] truncate">{v.cliente_nome}</td>
                    <td className="px-4 py-2.5 text-center font-black text-slate-500">{v.parcela}ª/{v.total_parcelas}</td>
                    <td className="px-4 py-2.5 font-bold whitespace-nowrap">{fmtDate(v.data_vencimento)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-emerald-700 whitespace-nowrap">R$ {fmt(v.comissao_calculada)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black border rounded-full ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-400">{v.data_pagamento ? fmtDate(v.data_pagamento) : '---'}</td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center">
                        {v.status !== 'Pago' ? (
                          <button onClick={() => handleMarcarPago(v.id)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg transition-colors mx-auto">
                            <CheckCircle2 size={10}/> Confirmar
                          </button>
                        ) : (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto"/>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {vencimentosFiltrados.length > 0 && (
              <tfoot>
                <tr className="bg-[#0A3D73] text-white text-xs font-black">
                  <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wide">Total ({vencimentosFiltrados.length} venc.)</td>
                  <td className="px-4 py-2.5 text-right font-mono">R$ {fmt(vencimentosFiltrados.reduce((a,v) => a+(v.comissao_calculada||0), 0))}</td>
                  <td colSpan={isAdmin?3:2}/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Comissoes;