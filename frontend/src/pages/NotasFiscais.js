import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { FilePlus, Search, CalendarDays, ReceiptText, Lock, CheckCircle2, DollarSign, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

const fmtDate = (d) => {
  if (!d) return '---';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
};

const sapInput = "bg-white border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]/20 rounded-none h-9 text-xs font-bold uppercase px-3 w-full outline-none transition-all";
const sapLabel = "text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 block";

const FORM_INITIAL = {
  numero_nf: '',
  pedido_id: '',
  valor_total: '',
  numero_parcelas: '1',
  data_p1: '',
  data_p2: '',
  data_p3: '',
};

const STATUS_VENC = {
  Pago:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Pendente: { cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  Atrasado: { cls: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500' },
};

const NotasFiscais = () => {
  const { isAdmin } = useAuth();
  const [notas, setNotas] = useState([]);
  const [vencimentos, setVencimentos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNota, setExpandedNota] = useState(null);
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [notasRes, vencRes, pedidosRes] = await Promise.all([
        api.get('/notas-fiscais'),
        api.get('/vencimentos'),
        api.get('/pedidos'),
      ]);
      setNotas(notasRes.data || []);
      setVencimentos(vencRes.data || []);
      setPedidos(pedidosRes.data || []);
    } catch { toast.error('Erro ao carregar dados financeiros'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Acesso negado');
    try {
      const payload = {
        numero_nf: formData.numero_nf,
        pedido_id: formData.pedido_id,
        valor_total: parseFloat(String(formData.valor_total).replace(/\./g, '').replace(',', '.')) || 0,
        numero_parcelas: parseInt(formData.numero_parcelas),
        datas_manuais: [formData.data_p1, formData.data_p2, formData.data_p3].filter(Boolean),
      };
      await api.post('/notas-fiscais', payload);
      toast.success('NF lançada e vencimentos gerados!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch { toast.error('Erro ao criar nota fiscal'); }
  };

  const handleDelete = async (notaId) => {
    if (!isAdmin) return;
    if (window.confirm('Excluir esta NF e seus vencimentos?')) {
      try {
        await api.delete(`/notas-fiscais/${notaId}`);
        toast.success('NF removida!');
        fetchData();
      } catch { toast.error('Erro ao deletar NF'); }
    }
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

  const resetForm = () => { setFormData(FORM_INITIAL); };

  const getVencimentosDaNota = (notaId) =>
    vencimentos.filter(v => v.nota_fiscal_id === notaId);

  // Pedidos disponíveis = não NF_EMITIDA ou o que já tem NF (para não duplicar)
  const pedidosDisponiveis = pedidos.filter(p => p.status !== 'NF_EMITIDA' && p.status !== 'CANCELADO');

  const notasFiltradas = notas.filter(n => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      n.numero_nf?.toLowerCase().includes(s) ||
      n.cliente_nome?.toLowerCase().includes(s) ||
      n.numero_fabrica?.toLowerCase().includes(s) ||
      n.numero_fe?.toLowerCase().includes(s)
    );
  });

  // Totalizadores
  const totalNFs = notas.length;
  const totalFaturado = notas.reduce((a, n) => a + (n.valor_total || 0), 0);
  const totalComissao = notas.reduce((a, n) => a + (n.comissao_total || 0), 0);
  const totalPendente = vencimentos.filter(v => v.status !== 'Pago').reduce((a, v) => a + (v.comissao_calculada || 0), 0);
  const totalAtrasado = vencimentos.filter(v => v.status === 'Atrasado').reduce((a, v) => a + (v.comissao_calculada || 0), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Carregando Notas Fiscais...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen font-sans antialiased text-slate-800">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b-2 border-[#0A3D73] pb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            Controle Financeiro {!isAdmin && <Lock size={14} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Notas Fiscais & Vencimentos de Comissões · {totalNFs} NFs
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-300 h-9 px-3 gap-2">
            <Search size={13} className="text-slate-400" />
            <input
              placeholder="NF, cliente, pedido..."
              className="text-[11px] font-bold uppercase bg-transparent outline-none w-44"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-black text-[10px] uppercase h-9 tracking-widest"
            >
              <FilePlus size={14} className="mr-1.5" /> Lançar NF
            </Button>
          )}
        </div>
      </div>

      {/* TOTALIZADORES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'NFs Emitidas',      value: totalNFs,                     color: 'text-slate-700',   bg: 'bg-white border-slate-200' },
          { label: 'Total Faturado',     value: `R$ ${fmt(totalFaturado)}`,   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'Comissão Total',     value: `R$ ${fmt(totalComissao)}`,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Comissão Pendente',  value: `R$ ${fmt(totalPendente)}`,   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
          { label: 'Comissão Atrasada',  value: `R$ ${fmt(totalAtrasado)}`,   color: 'text-red-700',     bg: totalAtrasado > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200' },
        ].map((item, i) => (
          <div key={i} className={`p-3 border ${item.bg}`}>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{item.label}</p>
            <p className={`text-sm font-black ${item.color} font-mono mt-0.5`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* TABELA DE NFs */}
      <Card className="border border-slate-300 rounded-none bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-[9px] font-black uppercase tracking-wider">
                <th className="px-4 py-3 border-r border-blue-800">NF</th>
                <th className="px-4 py-3 border-r border-blue-800">Pedido / FE</th>
                <th className="px-4 py-3 border-r border-blue-800">Cliente</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">Valor NF</th>
                <th className="px-4 py-3 border-r border-blue-800 text-right">Comissão</th>
                <th className="px-4 py-3 border-r border-blue-800 text-center">Parcelas</th>
                <th className="px-4 py-3 border-r border-blue-800 text-center">Situação</th>
                {isAdmin && <th className="px-4 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <ReceiptText size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhuma nota fiscal encontrada
                  </td>
                </tr>
              ) : notasFiltradas.map((nota, idx) => {
                const vencs = getVencimentosDaNota(nota.id);
                const isExpanded = expandedNota === nota.id;
                const todosPagos = vencs.length > 0 && vencs.every(v => v.status === 'Pago');
                const temAtrasado = vencs.some(v => v.status === 'Atrasado');

                return (
                  <React.Fragment key={nota.id}>
                    <tr
                      className={`text-[11px] border-b border-slate-100 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      } hover:bg-blue-50`}
                      onClick={() => setExpandedNota(isExpanded ? null : nota.id)}
                    >
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <p className="font-black text-blue-800 font-mono">NF {nota.numero_nf}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{fmtDate(nota.criado_em?.substring(0,10))}</p>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <p className="font-black text-slate-700">{nota.numero_fabrica || '— aguardando —'}</p>
                        <p className="text-[9px] text-blue-600 font-bold font-mono">{nota.numero_fe || '---'}</p>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <p className="font-bold uppercase text-slate-800 max-w-[160px] truncate">{nota.cliente_nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5 max-w-[160px] truncate">{nota.item_nome}</p>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100 text-right font-black whitespace-nowrap">
                        R$ {fmt(nota.valor_total)}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100 text-right font-black text-emerald-700 whitespace-nowrap">
                        R$ {fmt(nota.comissao_total)}
                        <p className="text-[9px] text-slate-400 font-bold">{fmt(nota.comissao_percent)}%</p>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100 text-center font-black text-slate-600">
                        {nota.numero_parcelas}x
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black border ${
                          todosPagos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          temAtrasado ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {todosPagos ? '✓ QUITADO' : temAtrasado ? 'ATRASADO' : 'PENDENTE'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setExpandedNota(isExpanded ? null : nota.id)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                            <button
                              onClick={() => handleDelete(nota.id)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* VENCIMENTOS EXPANDIDOS */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="p-0 border-b border-slate-200">
                          <div className="bg-slate-50 border-t border-slate-200">
                            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                <CalendarDays size={11} /> Cronograma de Vencimentos
                              </p>
                            </div>
                            <table className="w-full">
                              <thead>
                                <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-200">
                                  <th className="px-6 py-2">Parcela</th>
                                  <th className="px-6 py-2">Vencimento</th>
                                  <th className="px-6 py-2 text-right">Valor Parcela</th>
                                  <th className="px-6 py-2 text-right">Comissão</th>
                                  <th className="px-6 py-2 text-center">Status</th>
                                  <th className="px-6 py-2">Pago em</th>
                                  {isAdmin && <th className="px-6 py-2 text-center">Ação</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {vencs.map(v => {
                                  const cfg = STATUS_VENC[v.status] || STATUS_VENC.Pendente;
                                  return (
                                    <tr key={v.id} className="border-b border-slate-100 text-[11px]">
                                      <td className="px-6 py-2 font-black text-slate-600">{v.parcela}ª / {v.total_parcelas}</td>
                                      <td className="px-6 py-2 font-bold text-slate-700">{fmtDate(v.data_vencimento)}</td>
                                      <td className="px-6 py-2 text-right font-bold">R$ {fmt(v.valor_parcela)}</td>
                                      <td className="px-6 py-2 text-right font-black text-emerald-700">R$ {fmt(v.comissao_calculada)}</td>
                                      <td className="px-6 py-2 text-center">
                                        <span className={`flex items-center justify-center gap-1 px-2 py-0.5 text-[9px] font-black border w-fit mx-auto ${cfg.cls}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                          {v.status}
                                        </span>
                                      </td>
                                      <td className="px-6 py-2 text-[10px] text-slate-400 font-bold">
                                        {v.data_pagamento ? fmtDate(v.data_pagamento) : '---'}
                                      </td>
                                      {isAdmin && (
                                        <td className="px-6 py-2 text-center">
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
      </Card>

      {/* DIALOG LANÇAR NF */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg bg-white rounded-none p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 font-black">
              <ReceiptText size={15} /> Registrar Faturamento (NF)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* BLOCO 1 — IDENTIFICAÇÃO */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                01 · Identificação
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={sapLabel}>Número da NF *</label>
                  <Input
                    value={formData.numero_nf}
                    onChange={e => setFormData({ ...formData, numero_nf: e.target.value })}
                    required className={sapInput} placeholder="000.000"
                  />
                </div>
                <div>
                  <label className={sapLabel}>Nº de Parcelas</label>
                  <select
                    value={formData.numero_parcelas}
                    onChange={e => setFormData({ ...formData, numero_parcelas: e.target.value })}
                    className={`${sapInput} cursor-pointer`}
                  >
                    <option value="1">1 parcela</option>
                    <option value="2">2 parcelas</option>
                    <option value="3">3 parcelas</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={sapLabel}>Pedido Origem *</label>
                  <select
                    value={formData.pedido_id}
                    onChange={e => setFormData({ ...formData, pedido_id: e.target.value })}
                    className={`${sapInput} cursor-pointer`}
                    required
                  >
                    <option value="">— Selecione o pedido —</option>
                    {pedidosDisponiveis.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.numero_fabrica || 'S/REF'} · {p.cliente_nome?.split(' ')[0]} · {p.item_nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BLOCO 2 — VALOR */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                02 · Valor da NF
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3">
                <label className="text-[9px] font-black uppercase text-blue-700 mb-1 block flex items-center gap-1">
                  <DollarSign size={10} /> Valor Total Faturado (R$) *
                </label>
                <Input
                  value={formData.valor_total}
                  onChange={e => setFormData({ ...formData, valor_total: e.target.value })}
                  placeholder="0,00" required
                  className="bg-white border-blue-300 focus:border-blue-600 rounded-none h-10 text-sm font-black text-blue-900 px-3 w-full outline-none"
                />
                <p className="text-[8px] text-blue-400 font-bold mt-1">* Insira o valor real da NF (pode ter variação de até 10%)</p>
              </div>
            </div>

            {/* BLOCO 3 — VENCIMENTOS */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/30 pb-1 mb-3">
                03 · Cronograma de Vencimentos
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 space-y-2">
                <div>
                  <label className={sapLabel}>1ª Parcela *</label>
                  <Input type="date" value={formData.data_p1}
                    onChange={e => setFormData({ ...formData, data_p1: e.target.value })}
                    required className={sapInput} />
                </div>
                {formData.numero_parcelas >= '2' && (
                  <div>
                    <label className={sapLabel}>2ª Parcela *</label>
                    <Input type="date" value={formData.data_p2}
                      onChange={e => setFormData({ ...formData, data_p2: e.target.value })}
                      required className={sapInput} />
                  </div>
                )}
                {formData.numero_parcelas >= '3' && (
                  <div>
                    <label className={sapLabel}>3ª Parcela *</label>
                    <Input type="date" value={formData.data_p3}
                      onChange={e => setFormData({ ...formData, data_p3: e.target.value })}
                      required className={sapInput} />
                  </div>
                )}
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col md:flex-row justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none text-[10px] font-black uppercase px-8 h-10 border-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-8 rounded-none text-[10px] font-black uppercase h-10 tracking-widest">
                Confirmar & Gerar Comissões
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotasFiscais;