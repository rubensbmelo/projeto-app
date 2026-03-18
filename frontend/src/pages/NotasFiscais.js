import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { FilePlus, Search, CalendarDays, ReceiptText, Lock, CheckCircle2, DollarSign, Trash2, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtDate = (d) => { if (!d) return '---'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); };

const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";
const inpSm = "w-full border border-slate-200 rounded-lg bg-white px-3 h-9 text-xs font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";

const FORM_INITIAL = { numero_nf: '', data_emissao: '', pedido_id: '', valor_total: '', numero_parcelas: '1', data_p1: '', data_p2: '', data_p3: '', qtde_entregue: '', motivo_entrega: '' };

const STATUS_VENC = {
  Pago:     { cls: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  Pendente: { cls: 'bg-blue-100 text-blue-700 border-blue-300',         dot: 'bg-blue-500' },
  Atrasado: { cls: 'bg-red-100 text-red-700 border-red-300',            dot: 'bg-red-500' },
};

const getVariacaoInfo = (qtdePedido, qtdeEntregue) => {
  if (!qtdePedido || !qtdeEntregue) return null;
  const variacao = ((qtdeEntregue - qtdePedido) / qtdePedido) * 100;
  const abs = Math.abs(variacao);
  const sinal = variacao >= 0 ? '+' : '';
  if (abs <= 10) return { cor: 'bg-emerald-100 text-emerald-800 border-emerald-300', semaforo: '🟢', label: `${sinal}${variacao.toFixed(1)}%`, ok: true };
  if (abs <= 20) return { cor: 'bg-orange-100 text-orange-800 border-orange-300', semaforo: '🟡', label: `${sinal}${variacao.toFixed(1)}%`, ok: false };
  return { cor: 'bg-red-100 text-red-800 border-red-300', semaforo: '🔴', label: `${sinal}${variacao.toFixed(1)}%`, ok: false };
};

const NotasFiscais = () => {
  const { isAdmin } = useAuth();
  const [notas, setNotas] = useState([]);
  const [vencimentos, setVencimentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNota, setExpandedNota] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [editandoData, setEditandoData] = useState(null);
  const [novaData, setNovaData] = useState('');

  const pedidoSelecionado = pedidos.find(p => p.id === formData.pedido_id);
  const qtdePedida = pedidoSelecionado?.quantidade || 0;
  const previewVariacao = formData.qtde_entregue && qtdePedida ? getVariacaoInfo(qtdePedida, parseInt(formData.qtde_entregue)) : null;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [notasRes, vencRes, pedidosRes, matsRes] = await Promise.all([api.get('/notas-fiscais'), api.get('/vencimentos'), api.get('/pedidos'), api.get('/materiais')]);
      setNotas(notasRes.data || []); setVencimentos(vencRes.data || []); setPedidos(pedidosRes.data || []); setMateriais(matsRes.data || []);
    } catch { toast.error('Erro ao carregar dados financeiros'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Acesso negado');
    try {
      const payload = {
        numero_nf: formData.numero_nf, data_emissao: formData.data_emissao, pedido_id: formData.pedido_id,
        valor_total: parseFloat(String(formData.valor_total).replace(/\./g, '').replace(',', '.')) || 0,
        numero_parcelas: parseInt(formData.numero_parcelas),
        datas_manuais: [formData.data_p1, formData.data_p2, formData.data_p3].filter(Boolean),
        qtde_entregue: formData.qtde_entregue ? parseInt(formData.qtde_entregue) : null,
        motivo_entrega: formData.motivo_entrega || null,
      };
      await api.post('/notas-fiscais', payload);
      if (formData.qtde_entregue && pedidoSelecionado) {
        const qtdeEntregue = parseInt(formData.qtde_entregue);
        const qtdePedida = pedidoSelecionado.quantidade || 0;
        const mat = materiais.find(m => m.numero_fe?.toUpperCase() === pedidoSelecionado.numero_fe?.toUpperCase());
        const pesoUnit = mat ? parseFloat(mat.peso_unit || 0) : qtdePedida > 0 ? (pedidoSelecionado.peso_total || 0) / qtdePedida : 0;
        const precoMilheiro = pedidoSelecionado.itens?.[0]?.valor_unitario || 0;
        const comissaoPercent = pedidoSelecionado.itens?.[0]?.comissao_percent || 0;
        const novoPesoTotal = qtdeEntregue * pesoUnit;
        const novoValorTotal = (qtdeEntregue / 1000) * precoMilheiro;
        const novaComissao = novoValorTotal * comissaoPercent / 100;
        const variacao = qtdePedida > 0 ? ((qtdeEntregue - qtdePedida) / qtdePedida * 100).toFixed(1) : 0;
        await api.put(`/pedidos/${pedidoSelecionado.id}`, { ...pedidoSelecionado, quantidade: qtdeEntregue, peso_total: novoPesoTotal, valor_total: novoValorTotal > 0 ? novoValorTotal : pedidoSelecionado.valor_total, comissao_valor: novaComissao > 0 ? novaComissao : pedidoSelecionado.comissao_valor, status: 'NF_EMITIDA', historico_entrega: { qtde_pedida: qtdePedida, qtde_entregue: qtdeEntregue, variacao_percent: variacao, motivo: formData.motivo_entrega || 'cliente_aceitou', registrado_em: new Date().toISOString() }, itens: pedidoSelecionado.itens?.map((item, i) => i === 0 ? { ...item, quantidade: qtdeEntregue, peso_calculado: novoPesoTotal, subtotal: novoValorTotal > 0 ? novoValorTotal : item.subtotal, comissao_valor: novaComissao > 0 ? novaComissao : item.comissao_valor } : item) || [] });
        if (formData.motivo_entrega === 'entrega_parcial') {
          const saldo = qtdePedida - qtdeEntregue;
          if (saldo > 0) {
            const numMae = pedidoSelecionado.numero_fabrica || '';
            const pesoSaldo = saldo * pesoUnit; const valorSaldo = (saldo / 1000) * precoMilheiro; const comissaoSaldo = valorSaldo * comissaoPercent / 100;
            await api.post('/pedidos', { cliente_nome: pedidoSelecionado.cliente_nome, item_nome: pedidoSelecionado.item_nome, numero_fabrica: `${numMae}-S1`, numero_fe: pedidoSelecionado.numero_fe, numero_oc: pedidoSelecionado.numero_oc, data_entrega: pedidoSelecionado.data_entrega, quantidade: saldo, peso_total: pesoSaldo, valor_total: valorSaldo, comissao_valor: comissaoSaldo, status: 'IMPLANTADO', pedido_mae: pedidoSelecionado.numero_fabrica, observacoes: `Saldo do pedido ${pedidoSelecionado.numero_fabrica}`, itens: pedidoSelecionado.itens?.map((item, i) => i === 0 ? { ...item, quantidade: saldo, peso_calculado: pesoSaldo, subtotal: valorSaldo, comissao_valor: comissaoSaldo } : item) || [] });
            toast.success(`Pedido saldo criado!`);
          }
        }
      }
      toast.success('NF lançada e vencimentos gerados!'); setDialogOpen(false); resetForm(); fetchData();
    } catch { toast.error('Erro ao criar nota fiscal'); }
  };

  const handleDelete = async (notaId) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir esta NF e seus vencimentos?')) {
      try { await api.delete(`/notas-fiscais/${notaId}`); toast.success('NF removida!'); fetchData(); }
      catch { toast.error('Erro ao deletar NF'); }
    }
  };

  const handleMarcarPago = async (vencId) => {
    if (!isAdmin) return;
    try {
      await api.put(`/vencimentos/${vencId}`, { status: 'Pago', data_pagamento: new Date().toISOString().split('T')[0] });
      toast.success('Pagamento confirmado!'); fetchData();
    } catch { toast.error('Erro ao confirmar pagamento'); }
  };

  const resetForm = () => setFormData(FORM_INITIAL);

  const handleEditarData = async (notaId) => {
    if (!novaData) return toast.error('Informe a data de emissão');
    try { await api.put(`/notas-fiscais/${notaId}`, { data_emissao: novaData }); toast.success('Data atualizada!'); setEditandoData(null); setNovaData(''); fetchData(); }
    catch { toast.error('Erro ao atualizar data'); }
  };

  const getVencimentosDaNota = (notaId) => vencimentos.filter(v => v.nota_fiscal_id === notaId);
  const getPedidoDaNota = (nota) => pedidos.find(p => p.id === nota.pedido_id);
  const pedidosDisponiveis = pedidos.filter(p => p.status !== 'NF_EMITIDA' && p.status !== 'CANCELADO');

  const notasFiltradas = notas.filter(n => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return n.numero_nf?.toLowerCase().includes(s) || n.cliente_nome?.toLowerCase().includes(s) || n.numero_fabrica?.toLowerCase().includes(s) || n.numero_fe?.toLowerCase().includes(s);
  });

  const totalNFs = notas.length;
  const totalFaturado = notas.reduce((a,n) => a+(n.valor_total||0), 0);
  const totalComissao = notas.reduce((a,n) => a+(n.comissao_total||0), 0);
  const totalPendente = vencimentos.filter(v => v.status !== 'Pago').reduce((a,v) => a+(v.comissao_calculada||0), 0);
  const totalAtrasado = vencimentos.filter(v => v.status === 'Atrasado').reduce((a,v) => a+(v.comissao_calculada||0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Notas Fiscais...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">Controle Financeiro {!isAdmin && <Lock size={14} className="text-slate-400"/>}</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Notas Fiscais & Vencimentos · {totalNFs} NFs</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="NF, cliente, pedido..." className="text-xs font-semibold bg-transparent outline-none w-44 text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          {isAdmin && (
            <button onClick={() => { resetForm(); setDialogOpen(true); }} className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
              <FilePlus size={14}/> Lançar NF
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
        {[
          {label:'NFs Emitidas', value:totalNFs, cor:'#374151', fundo:'#F9FAFB'},
          {label:'Total Faturado', value:`R$ ${fmt(totalFaturado)}`, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Comissão Total', value:`R$ ${fmt(totalComissao)}`, cor:'#166534', fundo:'#DCFCE7'},
          {label:'Comissão Pendente', value:`R$ ${fmt(totalPendente)}`, cor:'#1D4ED8', fundo:'#DBEAFE'},
          {label:'Comissão Atrasada', value:`R$ ${fmt(totalAtrasado)}`, cor: totalAtrasado>0?'#991B1B':'#374151', fundo: totalAtrasado>0?'#FEE2E2':'#F9FAFB'},
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{k.label}</p>
            <p className="text-base font-black font-mono" style={{color:k.cor}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-xs font-black uppercase tracking-wide">
                {['NF','Pedido / FE','Cliente','Valor NF','Comissão','Entrega','Parcelas','Situação'].map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.length === 0 ? (
                <tr><td colSpan={isAdmin?9:8} className="text-center py-16 text-slate-400">
                  <ReceiptText size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhuma nota fiscal encontrada</p>
                </td></tr>
              ) : notasFiltradas.map((nota, idx) => {
                const vencs = getVencimentosDaNota(nota.id);
                const isExpanded = expandedNota === nota.id;
                const todosPagos = vencs.length > 0 && vencs.every(v => v.status === 'Pago');
                const temAtrasado = vencs.some(v => v.status === 'Atrasado');
                const pedido = getPedidoDaNota(nota);
                const variacaoInfo = nota.qtde_entregue && pedido?.quantidade ? getVariacaoInfo(pedido.quantidade, nota.qtde_entregue) : null;
                return (
                  <React.Fragment key={nota.id}>
                    <tr className={`text-xs border-b border-slate-100 transition-colors cursor-pointer ${idx%2===0?'bg-white':'bg-slate-50/60'} hover:bg-blue-50`}
                      onClick={() => setExpandedNota(isExpanded ? null : nota.id)}>
                      <td className="px-4 py-3">
                        <p className="font-black text-[#0A3D73] font-mono">NF {nota.numero_nf}</p>
                        {editandoData === nota.id ? (
                          <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                            <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="text-xs border border-blue-400 rounded px-1 h-6 bg-white outline-none" autoFocus/>
                            <button onClick={() => handleEditarData(nota.id)} className="text-xs font-black text-white bg-blue-600 hover:bg-blue-700 px-1.5 h-6 rounded">✓</button>
                            <button onClick={() => { setEditandoData(null); setNovaData(''); }} className="text-xs font-black text-slate-500 hover:text-red-500 px-1 h-6">✕</button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-semibold mt-0.5 cursor-pointer hover:text-blue-500 flex items-center gap-1"
                            onClick={e => { e.stopPropagation(); setEditandoData(nota.id); setNovaData(nota.data_emissao || ''); }}>
                            {fmtDate(nota.data_emissao || nota.criado_em?.substring(0,10))}
                            {nota.data_emissao ? <span className="text-blue-400">✓</span> : <span className="text-orange-400">✎</span>}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-700">{nota.numero_fabrica||'— aguardando —'}</p>
                        <p className="text-xs text-[#0A3D73] font-bold font-mono">{nota.numero_fe||'---'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold uppercase max-w-[160px] truncate">{nota.cliente_nome}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 max-w-[160px] truncate">{nota.item_nome}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-black whitespace-nowrap">R$ {fmt(nota.valor_total)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        R$ {fmt(nota.comissao_total)}
                        <p className="text-xs text-slate-400 font-semibold">{fmt(nota.comissao_percent)}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {variacaoInfo ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${variacaoInfo.cor}`}>{variacaoInfo.semaforo} {variacaoInfo.label}</span>
                            <span className="text-xs text-slate-400 font-semibold font-mono">{nota.qtde_entregue?.toLocaleString('pt-BR')} / {pedido?.quantidade?.toLocaleString('pt-BR')}</span>
                          </div>
                        ) : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-slate-600">{nota.numero_parcelas}x</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${todosPagos?'bg-emerald-100 text-emerald-700 border-emerald-300':temAtrasado?'bg-red-100 text-red-700 border-red-300':'bg-blue-100 text-blue-700 border-blue-300'}`}>
                          {todosPagos?'✓ Quitado':temAtrasado?'Atrasado':'Pendente'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setExpandedNota(isExpanded?null:nota.id)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                              {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                            </button>
                            <button onClick={() => handleDelete(nota.id)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={isAdmin?9:8} className="p-0 border-b border-slate-200">
                          <div className="bg-slate-50 border-t border-slate-100">
                            <div className="px-5 py-2 border-b border-slate-200 flex items-center gap-2">
                              <CalendarDays size={12} className="text-[#0A3D73]"/>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Cronograma de Vencimentos</p>
                            </div>
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs font-black uppercase text-slate-400 border-b border-slate-200">
                                  {['Parcela','Vencimento','Valor Parcela','Comissão','Status','Pago em'].map(h => <th key={h} className="px-6 py-2">{h}</th>)}
                                  {isAdmin && <th className="px-6 py-2 text-center">Ação</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {vencs.map(v => {
                                  const cfg = STATUS_VENC[v.status] || STATUS_VENC.Pendente;
                                  return (
                                    <tr key={v.id} className="border-b border-slate-100 text-xs">
                                      <td className="px-6 py-2.5 font-black text-slate-600">{v.parcela}ª / {v.total_parcelas}</td>
                                      <td className="px-6 py-2.5 font-bold text-slate-700">{fmtDate(v.data_vencimento)}</td>
                                      <td className="px-6 py-2.5 font-bold">R$ {fmt(v.valor_parcela)}</td>
                                      <td className="px-6 py-2.5 font-black text-emerald-700">R$ {fmt(v.comissao_calculada)}</td>
                                      <td className="px-6 py-2.5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black border rounded-full ${cfg.cls}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{v.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-2.5 text-xs text-slate-400 font-semibold">{v.data_pagamento ? fmtDate(v.data_pagamento) : '---'}</td>
                                      {isAdmin && (
                                        <td className="px-6 py-2.5 text-center">
                                          {v.status !== 'Pago' ? (
                                            <button onClick={() => handleMarcarPago(v.id)} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg transition-colors mx-auto">
                                              <CheckCircle2 size={10}/> Confirmar
                                            </button>
                                          ) : <CheckCircle2 size={16} className="text-emerald-500 mx-auto"/>}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black"><ReceiptText size={15}/> Registrar Faturamento (NF)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Identificação</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Número da NF *</label><Input value={formData.numero_nf} onChange={e => setFormData({...formData, numero_nf:e.target.value})} required className={inp} placeholder="000.000"/></div>
                <div><label className={lbl}>Data de Emissão *</label><Input type="date" value={formData.data_emissao} onChange={e => setFormData({...formData, data_emissao:e.target.value})} required className={inp}/></div>
                <div><label className={lbl}>Nº de Parcelas</label>
                  <select value={formData.numero_parcelas} onChange={e => setFormData({...formData, numero_parcelas:e.target.value})} className={`${inpSm} cursor-pointer`}>
                    <option value="1">1 parcela</option><option value="2">2 parcelas</option><option value="3">3 parcelas</option>
                  </select>
                </div>
                <div className="col-span-2"><label className={lbl}>Pedido Origem *</label>
                  <select value={formData.pedido_id} onChange={e => setFormData({...formData, pedido_id:e.target.value})} className={`${inpSm} cursor-pointer`} required>
                    <option value="">— Selecione o pedido —</option>
                    {pedidosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.numero_fabrica||'S/REF'} · {p.cliente_nome?.split(' ')[0]} · {p.item_nome}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">02 · Valor da NF</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="text-xs font-black uppercase text-blue-700 mb-1 flex items-center gap-1"><DollarSign size={10}/> Valor Total Faturado (R$) *</label>
                <Input value={formData.valor_total} onChange={e => setFormData({...formData, valor_total:e.target.value})} placeholder="0,00" required className="bg-white border-blue-200 rounded-lg h-10 text-sm font-black text-blue-900 px-3 w-full outline-none focus:border-blue-500"/>
                <p className="text-xs text-blue-400 font-semibold mt-1">* Insira o valor real da NF (pode ter variação de até 10%)</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">03 · Controle de Entrega</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Qtde Pedida</label><div className="h-10 bg-white border border-slate-200 rounded-lg px-3 flex items-center text-xs font-black text-slate-500 font-mono">{qtdePedida ? qtdePedida.toLocaleString('pt-BR') : '—'}</div></div>
                  <div><label className={lbl}>Qtde Entregue</label><Input type="number" value={formData.qtde_entregue} onChange={e => setFormData({...formData, qtde_entregue:e.target.value})} placeholder="0" className={inp}/></div>
                </div>
                {previewVariacao && (
                  <div className={`mt-2 px-3 py-2 border rounded-lg flex items-center gap-2 ${previewVariacao.cor}`}>
                    <Package size={12}/>
                    <span className="text-xs font-black uppercase">Variação: {previewVariacao.semaforo} {previewVariacao.label} {previewVariacao.ok ? '— dentro da tolerância ✓' : '— fora da tolerância!'}</span>
                  </div>
                )}
                {previewVariacao && !previewVariacao.ok && (
                  <div className="mt-3 space-y-2">
                    <label className={lbl}>Como tratar o saldo? *</label>
                    {[{value:'cliente_aceitou',label:'✅ Cliente aceitou — fechar'},{value:'fabrica_liquidou',label:'🏭 Fábrica liquidou — fechar'},{value:'entrega_parcial',label:`📦 Entrega parcial — criar saldo de ${Math.max(0,qtdePedida-(parseInt(formData.qtde_entregue)||0)).toLocaleString('pt-BR')} un`}].map(op => (
                      <label key={op.value} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-black transition-all ${formData.motivo_entrega===op.value?'bg-blue-50 border-blue-400':'bg-white border-slate-200'}`}>
                        <input type="radio" name="motivo_nf" value={op.value} checked={formData.motivo_entrega===op.value} onChange={e => setFormData({...formData, motivo_entrega:e.target.value})}/>{op.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">04 · Cronograma de Vencimentos</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div><label className={lbl}>1ª Parcela *</label><Input type="date" value={formData.data_p1} onChange={e => setFormData({...formData, data_p1:e.target.value})} required className={inp}/></div>
                {formData.numero_parcelas >= '2' && <div><label className={lbl}>2ª Parcela *</label><Input type="date" value={formData.data_p2} onChange={e => setFormData({...formData, data_p2:e.target.value})} required className={inp}/></div>}
                {formData.numero_parcelas >= '3' && <div><label className={lbl}>3ª Parcela *</label><Input type="date" value={formData.data_p3} onChange={e => setFormData({...formData, data_p3:e.target.value})} required className={inp}/></div>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setDialogOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 text-xs font-black uppercase bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-xl transition-colors">Confirmar & Gerar Comissões</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotasFiscais;