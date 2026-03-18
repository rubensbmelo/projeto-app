import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Package, Plus, Check, Lock, Search, Edit3, Weight, DollarSign,
  TrendingUp, FileText, Calendar, ChevronLeft, ChevronRight, X,
  GitBranch, CheckCircle2, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// CONSTANTES
// ============================================================
const STATUS_OPTIONS = ['PENDENTE', 'IMPLANTADO', 'NF_EMITIDA', 'CANCELADO'];

const STATUS_CONFIG = {
  PENDENTE:   { label: 'Pendente',   cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  IMPLANTADO: { label: 'Implantado', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
  NF_EMITIDA: { label: 'NF Emitida', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELADO:  { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-500 border-slate-300' },
};

const FORM_INITIAL = {
  numero_pedido_fabrica: '', numero_fe: '', item_nome: '',
  cliente_nome: '', numero_oc: '', data_entrega: '',
  quantidade: '', peso_unit: '', peso_total: '',
  preco_milheiro: '', valor_total: '', fator: '',
  comissao_percent: '', comissao_valor: '', status: 'PENDENTE',
};

const ENTREGA_FORM_INITIAL = {
  qtde_entregue: '', motivo: 'cliente_aceitou', observacao: '',
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ============================================================
// HELPERS
// ============================================================
const fmt = (v, c = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }).format(v || 0);
const toNum = (v) => { if (!v && v !== 0) return 0; if (typeof v === 'number') return v; return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0; };
const fmtDate = (d) => { if (!d) return '---'; return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); };
const nomeFantasia = (nomeCompleto) => {
  if (!nomeCompleto) return '---';
  const stop = ['S/A','SA','LTDA','LTDA-ME','ME','EIRELI','IND','COM','E','DE','DO','DA','DOS','DAS','IND.','COM.','S.A.'];
  const partes = nomeCompleto.toUpperCase().split(' ');
  const significativas = partes.filter(p => !stop.includes(p) && p.length > 1);
  return significativas.slice(0, 2).join(' ') || nomeCompleto.split(' ')[0];
};

const inp = "w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] focus:ring-2 focus:ring-[#0A3D73]/10 transition-all";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";

// ============================================================
// DATE RANGE PICKER
// ============================================================
const DateRangePicker = ({ dateStart, dateEnd, onChange, onClear }) => {
  const today = new Date();
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selecting, setSelecting] = React.useState('start');
  const [hoverDate, setHoverDate] = React.useState(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseD = (s) => s ? new Date(s + 'T00:00:00') : null;

  const handleDayClick = (day) => {
    const clicked = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const str = toStr(clicked);
    if (selecting === 'start') { onChange({ start: str, end: null }); setSelecting('end'); }
    else {
      const start = parseD(dateStart);
      if (clicked < start) onChange({ start: str, end: dateStart });
      else onChange({ start: dateStart, end: str });
      setSelecting('start'); setOpen(false);
    }
  };

  const inRange = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const s = parseD(dateStart); const e = parseD(dateEnd) || parseD(hoverDate);
    if (!s) return false;
    if (!e) return toStr(d) === dateStart;
    return d >= s && d <= e;
  };
  const isStart = (day) => toStr(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) === dateStart;
  const isEnd = (day) => toStr(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) === (dateEnd || hoverDate);

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  const labelBtn = () => {
    if (dateStart && dateEnd) return `${fmtDate(dateStart)} → ${fmtDate(dateEnd)}`;
    if (dateStart) return `A partir de ${fmtDate(dateStart)}`;
    return 'Filtrar por Data';
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        <button onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 h-9 px-3 text-xs font-bold rounded-lg border transition-all ${dateStart ? 'bg-[#0A3D73] text-white border-[#0A3D73]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0A3D73]'}`}>
          <Calendar size={13}/><span className="hidden sm:inline">{labelBtn()}</span>
        </button>
        {(dateStart || dateEnd) && (
          <button onClick={onClear} className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:border-red-400 hover:text-red-500 transition-all text-slate-400">
            <X size={13}/>
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 shadow-2xl rounded-xl w-72 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0A3D73] text-white">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1))} className="p-1 hover:bg-white/10 rounded-lg"><ChevronLeft size={14}/></button>
            <span className="text-xs font-black uppercase tracking-widest">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1))} className="p-1 hover:bg-white/10 rounded-lg"><ChevronRight size={14}/></button>
          </div>
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400">{selecting === 'start' ? '① Selecione a data inicial' : '② Selecione a data final'}</p>
          </div>
          <div className="grid grid-cols-7 px-3 pt-2">
            {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-black text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`}/>)}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const day = i+1;
              const iR = inRange(day); const iS = isStart(day); const iE = isEnd(day);
              const isT = toStr(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) === toStr(today);
              return (
                <button key={day} onClick={() => handleDayClick(day)}
                  onMouseEnter={() => { if (selecting === 'end' && dateStart) setHoverDate(toStr(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))); }}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`h-8 w-full text-xs font-bold rounded transition-all
                    ${iS||iE ? 'bg-[#0A3D73] text-white' : ''}
                    ${iR&&!iS&&!iE ? 'bg-blue-100 text-blue-800' : ''}
                    ${!iR&&!iS&&!iE ? 'hover:bg-slate-100 text-slate-700' : ''}
                    ${isT&&!iS&&!iE ? 'ring-1 ring-[#0A3D73] text-[#0A3D73] font-black' : ''}`}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-3 py-2 flex flex-wrap gap-1.5">
            {[
              {label:'Este mês', fn:()=>{const n=new Date();onChange({start:toStr(new Date(n.getFullYear(),n.getMonth(),1)),end:toStr(new Date(n.getFullYear(),n.getMonth()+1,0))});setSelecting('start');setOpen(false);}},
              {label:'Mês anterior', fn:()=>{const n=new Date();onChange({start:toStr(new Date(n.getFullYear(),n.getMonth()-1,1)),end:toStr(new Date(n.getFullYear(),n.getMonth(),0))});setSelecting('start');setOpen(false);}},
              {label:'Este ano', fn:()=>{const n=new Date();onChange({start:`${n.getFullYear()}-01-01`,end:`${n.getFullYear()}-12-31`});setSelecting('start');setOpen(false);}},
            ].map(s => (
              <button key={s.label} onClick={s.fn} className="text-xs font-bold px-2 py-1 bg-slate-100 hover:bg-[#0A3D73] hover:text-white rounded transition-all text-slate-600">{s.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const Pedidos = () => {
  const { isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [clienteInput, setClienteInput] = useState('');
  const [showClientesDrop, setShowClientesDrop] = useState(false);
  const [entregaDialog, setEntregaDialog] = useState(false);
  const [entregaPedido, setEntregaPedido] = useState(null);
  const [entregaForm, setEntregaForm] = useState(ENTREGA_FORM_INITIAL);
  const [formData, setFormData] = useState(FORM_INITIAL);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [r1, r2, r3] = await Promise.all([api.get('/pedidos'), api.get('/materiais'), api.get('/clientes')]);
        setPedidos(Array.isArray(r1.data) ? r1.data : []);
        setMateriais(Array.isArray(r2.data) ? r2.data : []);
        setClientesBase(Array.isArray(r3.data) ? r3.data : []);
      } catch { toast.error('Erro ao sincronizar dados'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fetchPedidos = async () => {
    try { const r = await api.get('/pedidos'); setPedidos(Array.isArray(r.data) ? r.data : []); }
    catch { toast.error('Erro ao carregar pedidos'); }
  };

  const listaClientes = useMemo(() => {
    const set = new Set([...clientesBase.map(c => c.nome?.toUpperCase()), ...pedidos.map(p => p.cliente_nome?.toUpperCase())].filter(Boolean));
    return [...set].sort();
  }, [clientesBase, pedidos]);

  const contadores = useMemo(() => {
    const c = { TODOS: pedidos.length, PENDENTE: 0, IMPLANTADO: 0, NF_EMITIDA: 0, CANCELADO: 0 };
    pedidos.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, [pedidos]);

  const totais = useMemo(() => {
    const lista = pedidos.filter(p => {
      const matchStatus = filterStatus === 'TODOS' || p.status === filterStatus;
      const termo = searchTerm.toLowerCase();
      const matchSearch = !termo || p.cliente_nome?.toLowerCase().includes(termo) || p.numero_fe?.toLowerCase().includes(termo) || p.numero_oc?.toLowerCase().includes(termo) || p.item_nome?.toLowerCase().includes(termo) || p.numero_fabrica?.toLowerCase().includes(termo);
      let matchDate = true;
      if (dateStart || dateEnd) {
        const de = p.data_entrega ? p.data_entrega.substring(0,10) : '';
        if (dateStart && dateEnd) matchDate = de >= dateStart && de <= dateEnd;
        else if (dateStart) matchDate = de >= dateStart;
        else if (dateEnd) matchDate = de <= dateEnd;
      }
      return matchStatus && matchSearch && matchDate;
    });
    const peso = lista.reduce((a,p) => a + toNum(p.peso_total), 0);
    const valor = lista.reduce((a,p) => a + toNum(p.valor_total), 0);
    return {
      lista,
      peso, valor,
      fatorMedio: peso > 0 ? valor/peso : 0,
      comissao: lista.reduce((a,p) => a + toNum(p.comissao_valor || p.itens?.[0]?.comissao_valor || 0), 0),
      qtde: lista.reduce((a,p) => a + (parseInt(p.quantidade)||0), 0),
    };
  }, [pedidos, filterStatus, searchTerm, dateStart, dateEnd]);

  const handleFEChange = (fe) => {
    const valor = fe.toUpperCase();
    const mat = materiais.find(m => m.numero_fe?.toUpperCase() === valor || m.codigo?.toUpperCase() === valor);
    if (mat) {
      const pesoUnit = toNum(mat.peso_unit); const precoMilheiro = toNum(mat.preco_unit);
      const comissaoPercent = toNum(mat.comissao); const qtde = toNum(formData.quantidade);
      const pesoTotal = qtde * pesoUnit; const valorTotal = (qtde/1000) * precoMilheiro;
      const fator = pesoUnit > 0 ? precoMilheiro/(pesoUnit*1000) : 0;
      const comissaoValor = valorTotal * comissaoPercent/100;
      setFormData(prev => ({...prev, numero_fe:valor, item_nome:mat.nome||mat.descricao||'',
        peso_unit:String(mat.peso_unit||'').replace('.',','), preco_milheiro:String(mat.preco_unit||'').replace('.',','),
        comissao_percent:String(mat.comissao||'').replace('.',','),
        peso_total:qtde>0?fmt(pesoTotal):'', valor_total:qtde>0?fmt(valorTotal):'',
        fator:fmt(fator), comissao_valor:qtde>0?fmt(comissaoValor):'' }));
    } else { setFormData(prev => ({...prev, numero_fe:valor})); }
  };

  const handleQtdeChange = (qtdeStr) => {
    const qtde = toNum(qtdeStr); const pesoUnit = toNum(formData.peso_unit);
    const precoMilheiro = toNum(formData.preco_milheiro); const comissaoPercent = toNum(formData.comissao_percent);
    const pesoTotal = qtde*pesoUnit; const valorTotal = (qtde/1000)*precoMilheiro;
    const fator = pesoUnit>0 ? precoMilheiro/(pesoUnit*1000) : 0;
    const comissaoValor = valorTotal*comissaoPercent/100;
    setFormData(prev => ({...prev, quantidade:qtdeStr,
      peso_total:qtde>0?fmt(pesoTotal):'', valor_total:qtde>0?fmt(valorTotal):'',
      fator:fmt(fator), comissao_valor:qtde>0?fmt(comissaoValor):''}));
  };

  const handleComissaoPercentChange = (val) => {
    const comissaoPercent = toNum(val); const valorTotal = toNum(formData.valor_total);
    setFormData(prev => ({...prev, comissao_percent:val, comissao_valor:fmt(valorTotal*comissaoPercent/100)}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      cliente_nome: formData.cliente_nome.toUpperCase(),
      item_nome: formData.item_nome.toUpperCase(),
      numero_fabrica: formData.numero_pedido_fabrica,
      numero_fe: formData.numero_fe,
      numero_oc: formData.numero_oc,
      data_entrega: formData.data_entrega,
      quantidade: parseInt(formData.quantidade)||0,
      peso_total: toNum(formData.peso_total),
      valor_total: toNum(formData.valor_total),
      comissao_valor: toNum(formData.comissao_valor),
      status: formData.status,
      itens: [{
        material_id:'', quantidade:parseInt(formData.quantidade)||0,
        peso_calculado:toNum(formData.peso_total), valor_unitario:toNum(formData.preco_milheiro),
        subtotal:toNum(formData.valor_total), comissao_percent:toNum(formData.comissao_percent),
        comissao_valor:toNum(formData.comissao_valor), ipi:0,
      }],
    };
    try {
      if (editingPedido) { await api.put(`/pedidos/${editingPedido.id}`, payload); toast.success('Pedido atualizado!'); }
      else { await api.post('/pedidos', payload); toast.success('Pedido registrado!'); }
      setDialogOpen(false); resetForm(); fetchPedidos();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar pedido'); }
  };

  const handleEdit = (p) => {
    if (p.status === 'NF_EMITIDA' && !isAdmin) { toast.error('Pedido com NF emitida — apenas administradores podem editar'); return; }
    const item = p.itens?.[0] || {};
    setEditingPedido(p); setClienteInput(p.cliente_nome || '');
    setFormData({
      numero_pedido_fabrica:p.numero_fabrica||'', numero_fe:p.numero_fe||'',
      item_nome:p.item_nome||'', cliente_nome:p.cliente_nome||'',
      numero_oc:p.numero_oc||'', data_entrega:p.data_entrega||'',
      quantidade:String(p.quantidade||''), peso_unit:'',
      peso_total:String(p.peso_total||'').replace('.',','),
      preco_milheiro:String(item.valor_unitario||'').replace('.',','),
      valor_total:String(p.valor_total||'').replace('.',','),
      fator:p.peso_total>0?fmt(toNum(p.valor_total)/toNum(p.peso_total)):'0,00',
      comissao_percent:String(item.comissao_percent||'').replace('.',','),
      comissao_valor:String(p.comissao_valor||item.comissao_valor||'').replace('.',','),
      status:p.status||'PENDENTE',
    });
    setDialogOpen(true);
  };

  const resetForm = () => { setFormData(FORM_INITIAL); setClienteInput(''); setEditingPedido(null); };

  const handleAbrirEntrega = (e, pedido) => {
    e.stopPropagation(); setEntregaPedido(pedido);
    setEntregaForm({...ENTREGA_FORM_INITIAL, qtde_entregue:String(pedido.quantidade||'')});
    setEntregaDialog(true);
  };

  const handleConfirmarEntrega = async () => {
    const qtdeEntregue = parseInt(entregaForm.qtde_entregue)||0;
    const qtdePedida = parseInt(entregaPedido.quantidade)||0;
    const saldo = qtdePedida - qtdeEntregue;
    try {
      const historicoEntrega = {
        qtde_pedida:qtdePedida, qtde_entregue:qtdeEntregue,
        variacao_percent:qtdePedida>0?((qtdeEntregue-qtdePedida)/qtdePedida*100).toFixed(1):0,
        motivo:entregaForm.motivo, observacao:entregaForm.observacao,
        registrado_em:new Date().toISOString(),
      };
      const materialPedido = materiais.find(m => m.numero_fe?.toUpperCase() === entregaPedido.numero_fe?.toUpperCase());
      const pesoUnit = materialPedido ? toNum(materialPedido.peso_unit) : qtdePedida>0?toNum(entregaPedido.peso_total)/qtdePedida:0;
      const precoMilheiro = toNum(entregaPedido.itens?.[0]?.valor_unitario||0);
      const comissaoPercent = toNum(entregaPedido.itens?.[0]?.comissao_percent||0);
      const novoValorTotal = (qtdeEntregue/1000)*precoMilheiro;
      const novoPesoTotal = qtdeEntregue*pesoUnit;
      const novaComissao = novoValorTotal*comissaoPercent/100;
      await api.put(`/pedidos/${entregaPedido.id}`, {
        ...entregaPedido, quantidade:qtdeEntregue, peso_total:novoPesoTotal,
        valor_total:novoValorTotal, comissao_valor:novaComissao,
        historico_entrega:historicoEntrega,
        itens:[{...(entregaPedido.itens?.[0]||{}), quantidade:qtdeEntregue, peso_calculado:novoPesoTotal, subtotal:novoValorTotal, comissao_valor:novaComissao}],
      });
      if (entregaForm.motivo === 'entrega_parcial' && saldo > 0) {
        const numMae = entregaPedido.numero_fabrica||'';
        const saldosExistentes = pedidos.filter(p => p.numero_fabrica?.startsWith(numMae+'-S')).length;
        const numSaldo = `${numMae}-S${saldosExistentes+1}`;
        const pesoSaldo=saldo*pesoUnit; const valorSaldo=(saldo/1000)*precoMilheiro;
        const comissaoSaldo=valorSaldo*comissaoPercent/100;
        await api.post('/pedidos', {
          cliente_nome:entregaPedido.cliente_nome, item_nome:entregaPedido.item_nome,
          numero_fabrica:numSaldo, numero_fe:entregaPedido.numero_fe,
          numero_oc:entregaPedido.numero_oc, data_entrega:entregaPedido.data_entrega,
          quantidade:saldo, peso_total:pesoSaldo, valor_total:valorSaldo,
          comissao_valor:comissaoSaldo, status:'IMPLANTADO',
          pedido_mae:entregaPedido.numero_fabrica,
          observacoes:`Saldo do pedido ${entregaPedido.numero_fabrica}`,
          itens:[{...(entregaPedido.itens?.[0]||{}), quantidade:saldo, peso_calculado:pesoSaldo, subtotal:valorSaldo, comissao_valor:comissaoSaldo}],
        });
        toast.success(`Pedido saldo ${numSaldo} criado com ${saldo.toLocaleString('pt-BR')} unidades!`);
      } else { toast.success('Entrega registrada!'); }
      setEntregaDialog(false); setEntregaPedido(null); fetchPedidos();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao registrar entrega'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0A3D73] rounded-full animate-spin"/>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Sincronizando Carteira...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Gestão de Pedidos</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Carteira · {totais.lista.length} registros encontrados</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 px-3 gap-2 shadow-sm">
            <Search size={13} className="text-slate-400"/>
            <input placeholder="Buscar pedido, cliente, FE..." className="text-xs font-semibold bg-transparent outline-none w-44"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <DateRangePicker
            dateStart={dateStart} dateEnd={dateEnd}
            onChange={({start,end}) => {setDateStart(start||'');setDateEnd(end||'');}}
            onClear={() => {setDateStart('');setDateEnd('');}}
          />
          <button onClick={() => {resetForm();setDialogOpen(true);}}
            className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white text-xs font-black uppercase px-4 h-9 rounded-lg shadow-sm transition-colors">
            <Plus size={14}/> Novo Pedido
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          {label:'Peso Total', value:`${fmt(totais.peso/1000,3)} TON`, sub:`${fmt(totais.peso)} KG`, icon:Weight, cor:'#1E40AF', fundo:'#EFF6FF'},
          {label:'Qtde Total', value:totais.qtde.toLocaleString('pt-BR'), icon:Package, cor:'#374151', fundo:'#F9FAFB'},
          {label:'Valor Total', value:`R$ ${fmt(totais.valor)}`, icon:DollarSign, cor:'#166534', fundo:'#DCFCE7'},
          {label:'Fator Médio R$/KG', value:`R$ ${fmt(totais.fatorMedio)}`, icon:TrendingUp, cor:'#1D4ED8', fundo:'#DBEAFE'},
          {label:'Comissão Total', value:`R$ ${fmt(totais.comissao)}`, icon:TrendingUp, cor:'#92400E', fundo:'#FEF3C7'},
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:k.fundo}}>
                <k.icon size={13} style={{color:k.cor}}/>
              </div>
            </div>
            <p className="text-base font-black" style={{color:k.cor}}>{k.value}</p>
            {k.sub && <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── FILTROS STATUS ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['TODOS',...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filterStatus===s ? 'bg-[#0A3D73] text-white border-[#0A3D73] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0A3D73]'}`}>
            {s==='TODOS'?'Todos':STATUS_CONFIG[s]?.label} <span className="opacity-60">({contadores[s]||0})</span>
          </button>
        ))}
      </div>

      {/* ── TABELA ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0A3D73] text-white text-xs font-black uppercase tracking-wide">
                {['Pedido','FE','OC','Referência','Cliente','Entrega','Peso KG','Qtde','Vl. Milh.','Fator','Total','Comissão','Status'].map((h,i) => (
                  <th key={i} className={`px-3 py-3 whitespace-nowrap ${['Entrega','Peso KG','Qtde','Vl. Milh.','Fator','Total','Comissão'].includes(h)?'text-right':h==='Status'?'text-center':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {totais.lista.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-16 text-slate-400">
                  <FileText size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum pedido encontrado</p>
                </td></tr>
              ) : totais.lista.map((p,idx) => {
                const travado = p.status==='NF_EMITIDA' && !isAdmin;
                const item = p.itens?.[0]||{};
                const fator = toNum(p.peso_total)>0 ? toNum(p.valor_total)/toNum(p.peso_total) : 0;
                const comissaoValor = toNum(p.comissao_valor||item.comissao_valor||0);
                const precoMilheiro = toNum(item.valor_unitario||0);
                const statusCfg = STATUS_CONFIG[p.status]||STATUS_CONFIG.PENDENTE;
                return (
                  <tr key={p.id} onClick={() => handleEdit(p)}
                    className={`text-xs border-b border-slate-100 transition-colors
                      ${idx%2===0?'bg-white':'bg-slate-50/60'}
                      ${travado?'opacity-60 cursor-not-allowed':'hover:bg-blue-50 cursor-pointer'}`}>
                    <td className="px-3 py-2.5 font-black text-[#0A3D73] font-mono whitespace-nowrap">
                      {p.numero_fabrica||<span className="text-slate-300 italic font-normal text-xs">— aguardando —</span>}
                      {travado && <Lock size={9} className="inline ml-1"/>}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-blue-700 font-mono whitespace-nowrap">{p.numero_fe||'---'}</td>
                    <td className="px-3 py-2.5 font-bold text-amber-700 whitespace-nowrap">{p.numero_oc||'---'}</td>
                    <td className="px-3 py-2.5 font-semibold max-w-[140px] truncate">{p.item_nome||'---'}</td>
                    <td className="px-3 py-2.5 font-black whitespace-nowrap">
                      <span title={p.cliente_nome}>{nomeFantasia(p.cliente_nome)}</span>
                      {p.pedido_mae && <span className="ml-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1 rounded font-black">SALDO</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">{fmtDate(p.data_entrega)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{fmt(p.peso_total)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{(parseInt(p.quantidade)||0).toLocaleString('pt-BR')}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">{precoMilheiro>0?`R$ ${fmt(precoMilheiro)}`:'---'}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600 whitespace-nowrap">R$ {fmt(fator)}</td>
                    <td className="px-3 py-2.5 text-right font-black text-slate-800 whitespace-nowrap">R$ {fmt(p.valor_total)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">{comissaoValor>0?`R$ ${fmt(comissaoValor)}`:'---'}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 text-xs font-black border rounded-full ${statusCfg.cls}`}>{statusCfg.label}</span>
                        {p.status==='IMPLANTADO' && isAdmin && (
                          <button onClick={(e) => handleAbrirEntrega(e,p)}
                            className="text-xs font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1">
                            <GitBranch size={9}/> Entregar
                          </button>
                        )}
                        {p.historico_entrega && (
                          <span className={`text-xs font-black ${Math.abs(parseFloat(p.historico_entrega.variacao_percent))<=10?'text-emerald-600':Math.abs(parseFloat(p.historico_entrega.variacao_percent))<=20?'text-amber-600':'text-red-600'}`}>
                            {parseFloat(p.historico_entrega.variacao_percent)>=0?'+':''}{p.historico_entrega.variacao_percent}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {totais.lista.length > 0 && (
              <tfoot>
                <tr className="bg-[#0A3D73] text-white text-xs font-black">
                  <td colSpan={13} className="px-3 py-2.5 text-right uppercase tracking-wide">↓ Ver totais abaixo</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── TOTAIS FORA DO SCROLL ── */}
        {totais.lista.length > 0 && (
          <div className="border-t-2 border-[#0A3D73] bg-[#0A3D73] text-white">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs font-black">
              <span className="uppercase tracking-wide opacity-70">Totais — {totais.lista.length} pedidos</span>
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="opacity-60 font-bold text-xs">Peso Total</p>
                  <p className="font-black font-mono text-sm">{fmt(totais.peso)} KG</p>
                </div>
                <div className="text-center">
                  <p className="opacity-60 font-bold text-xs">Qtde Total</p>
                  <p className="font-black font-mono text-sm">{totais.qtde.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center">
                  <p className="opacity-60 font-bold text-xs">Fator Médio</p>
                  <p className="font-black font-mono text-sm">R$ {fmt(totais.fatorMedio)}</p>
                </div>
                <div className="text-center">
                  <p className="opacity-60 font-bold text-xs">Valor Total</p>
                  <p className="font-black font-mono text-sm text-emerald-300">R$ {fmt(totais.valor)}</p>
                </div>
                <div className="text-center">
                  <p className="opacity-60 font-bold text-xs">Comissão Total</p>
                  <p className="font-black font-mono text-sm text-yellow-300">R$ {fmt(totais.comissao)}</p>
                </div>
              </div>
            </div>
          </div>
        )
      </div>

      {/* ── DIALOG PEDIDO ── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => {setDialogOpen(o);if(!o)resetForm();}}>
        <DialogContent className="max-w-3xl bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-5 bg-[#0A3D73] text-white">
            <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black">
              <Package size={15}/> {editingPedido?'Editar Pedido':'Novo Pedido'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* Bloco 1 */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">01 · Identificação</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Nº Pedido Fábrica</label><Input value={formData.numero_pedido_fabrica} onChange={e => setFormData({...formData, numero_pedido_fabrica:e.target.value})} className={inp} placeholder="Após implantação"/></div>
                <div><label className={`${lbl} text-blue-700`}>Produto (FE) *</label><Input value={formData.numero_fe} onChange={e => handleFEChange(e.target.value)} className={`${inp} border-blue-200`} required/></div>
                <div><label className={`${lbl} text-amber-600`}>OC Cliente</label><Input value={formData.numero_oc} onChange={e => setFormData({...formData, numero_oc:e.target.value})} className={inp}/></div>
              </div>
            </div>

            {/* Bloco 2 */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">02 · Cliente & Produto</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <label className={lbl}>Cliente *</label>
                  <Input value={clienteInput} onChange={e=>{setClienteInput(e.target.value);setFormData({...formData,cliente_nome:e.target.value.toUpperCase()});setShowClientesDrop(true);}} onFocus={()=>setShowClientesDrop(true)} className={inp} required/>
                  {showClientesDrop && clienteInput.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-xl rounded-lg mt-1 max-h-36 overflow-y-auto">
                      {listaClientes.filter(c=>c.includes(clienteInput.toUpperCase())).map(cliente=>(
                        <div key={cliente} onClick={()=>{setFormData({...formData,cliente_nome:cliente});setClienteInput(cliente);setShowClientesDrop(false);}}
                          className="px-3 py-2 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between">
                          {cliente}<Check size={11} className="text-blue-600"/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div><label className={lbl}>Referência *</label><Input value={formData.item_nome} onChange={e=>setFormData({...formData,item_nome:e.target.value.toUpperCase()})} className={inp} required/></div>
                <div><label className={lbl}>Data de Entrega *</label><Input type="date" value={formData.data_entrega} onChange={e=>setFormData({...formData,data_entrega:e.target.value})} className={inp} required/></div>
                <div><label className={lbl}>Status</label>
                  <select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})} className={`${inp} cursor-pointer`} disabled={formData.status==='NF_EMITIDA'&&!isAdmin}>
                    {STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 3 */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0A3D73] border-b border-[#0A3D73]/20 pb-1.5 mb-3">03 · Quantidades & Valores</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div><label className={lbl}>Quantidade *</label><Input type="number" value={formData.quantidade} onChange={e=>handleQtdeChange(e.target.value)} className={inp} required/></div>
                <div><label className={lbl}>Peso Unit (KG)</label><div className="h-10 flex items-center px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500">{formData.peso_unit||'—'}</div></div>
                <div><label className={lbl}>Peso Total (KG)</label><div className="h-10 flex items-center px-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-800">{formData.peso_total||'—'}</div></div>
                <div><label className={`${lbl} text-amber-600`}>Vl. Milheiro</label><div className="h-10 flex items-center px-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-black text-amber-800">{formData.preco_milheiro||'—'}</div></div>
                <div><label className={`${lbl} text-blue-700`}>Fator R$/KG</label><div className="h-10 flex items-center px-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-black text-blue-800">R$ {formData.fator||'0,00'}</div></div>
                <div><label className={`${lbl} text-emerald-700`}>Valor Total</label><div className="h-10 flex items-center px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-emerald-800">R$ {formData.valor_total||'0,00'}</div></div>
                <div><label className={`${lbl} text-green-700`}>Comissão %</label><Input value={formData.comissao_percent} onChange={e=>handleComissaoPercentChange(e.target.value)} className={`${inp} border-green-200`} placeholder="Ex: 2,5"/></div>
                <div><label className={`${lbl} text-green-700`}>Comissão R$</label><div className="h-10 flex items-center px-3 bg-green-50 border border-green-200 rounded-lg text-xs font-black text-green-800">R$ {formData.comissao_valor||'0,00'}</div></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={()=>setDialogOpen(false)} className="rounded-xl text-xs font-black uppercase px-6 h-10 border-slate-200">Cancelar</Button>
              <Button type="submit" className="bg-[#0A3D73] hover:bg-[#082D54] text-white px-8 rounded-xl text-xs font-black uppercase h-10">Gravar Pedido</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG ENTREGA ── */}
      {entregaDialog && entregaPedido && (
        <Dialog open={entregaDialog} onOpenChange={(o)=>{setEntregaDialog(o);if(!o)setEntregaPedido(null);}}>
          <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-5 bg-[#0A3D73] text-white">
              <DialogTitle className="text-xs uppercase tracking-widest flex items-center gap-2 font-black">
                <GitBranch size={15}/> Registrar Entrega — {entregaPedido.numero_fabrica}
              </DialogTitle>
            </DialogHeader>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
                <p className="font-black text-blue-800">{nomeFantasia(entregaPedido.cliente_nome)} — {entregaPedido.item_nome}</p>
                <p className="text-blue-600 font-bold mt-1">Qtde pedida: <span className="font-black">{(entregaPedido.quantidade||0).toLocaleString('pt-BR')} unidades</span></p>
              </div>
              <div>
                <label className={lbl}>Qtde Entregue *</label>
                <Input type="number" value={entregaForm.qtde_entregue} onChange={e=>setEntregaForm({...entregaForm,qtde_entregue:e.target.value})} className={inp}/>
                {entregaForm.qtde_entregue && entregaPedido.quantidade && (() => {
                  const v = ((parseInt(entregaForm.qtde_entregue)-entregaPedido.quantidade)/entregaPedido.quantidade*100);
                  const abs = Math.abs(v);
                  const cor = abs<=10?'text-emerald-700 bg-emerald-50 border-emerald-200':abs<=20?'text-amber-700 bg-amber-50 border-amber-200':'text-red-700 bg-red-50 border-red-200';
                  return (
                    <div className={`mt-1.5 px-3 py-1.5 border rounded-lg text-xs font-black ${cor}`}>
                      Variação: {v>=0?'+':''}{v.toFixed(1)}%
                      {parseInt(entregaForm.qtde_entregue)<entregaPedido.quantidade && <span className="ml-2">· Saldo: {(entregaPedido.quantidade-parseInt(entregaForm.qtde_entregue)).toLocaleString('pt-BR')} un</span>}
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className={lbl}>Como tratar o saldo?</label>
                <div className="space-y-2">
                  {[
                    {value:'cliente_aceitou', label:'✅ Cliente aceitou — fechar', desc:'Pedido liquidado com a qtde entregue'},
                    {value:'fabrica_liquidou', label:'🏭 Fábrica liquidou — fechar', desc:'Fábrica não produzirá mais deste pedido'},
                    {value:'entrega_parcial', label:'📦 Entrega parcial — criar saldo', desc:`Saldo de ${Math.max(0,(entregaPedido.quantidade||0)-(parseInt(entregaForm.qtde_entregue)||0)).toLocaleString('pt-BR')} un vira novo pedido`},
                  ].map(op => (
                    <label key={op.value} className={`flex items-start gap-2 p-3 border rounded-xl cursor-pointer transition-all ${entregaForm.motivo===op.value?'bg-blue-50 border-blue-400':'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="motivo" value={op.value} checked={entregaForm.motivo===op.value} onChange={e=>setEntregaForm({...entregaForm,motivo:e.target.value})} className="mt-0.5"/>
                      <div>
                        <p className="text-xs font-black">{op.label}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{op.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className={lbl}>Observação</label>
                <input value={entregaForm.observacao} onChange={e=>setEntregaForm({...entregaForm,observacao:e.target.value})} className={`${inp} h-16`}/>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={()=>setEntregaDialog(false)} className="rounded-xl text-xs font-black uppercase h-10 flex-1">Cancelar</Button>
                <Button type="button" onClick={handleConfirmarEntrega} disabled={!entregaForm.qtde_entregue}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase h-10 flex-1">
                  <CheckCircle2 size={12} className="mr-1"/> Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Pedidos;