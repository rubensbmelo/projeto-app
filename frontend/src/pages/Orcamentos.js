import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Trash2, FileText, Send, CheckCircle, XCircle, Clock, Search, X, Printer, Edit2 } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const LOGO_B64 = "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";

const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().split("T")[0];
const mascaraTel = (v) => {
  let n = v.replace(/\D/g, "").substring(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
};

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock },
  ENVIADO:  { label: "Enviado",  color: "bg-blue-100 text-blue-800 border-blue-300",    icon: Send },
  APROVADO: { label: "Aprovado", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle },
  RECUSADO: { label: "Recusado", color: "bg-red-100 text-red-700 border-red-300",       icon: XCircle },
};

const ITEM_VAZIO = { fe: "", descricao: "", medidas: "", unidade: "Mil", qtd_min: "", preco_milhar: "", subtotal: 0 };

const inp = "w-full border-b border-slate-200 bg-transparent py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#0A3D73] transition-colors";
const lbl = "text-xs font-bold uppercase tracking-wide text-slate-400 mb-1 block";

export default function Orcamentos() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("lista");
  const [orcamentoAtual, setOrcamentoAtual] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteSugestoes, setClienteSugestoes] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    numero_proposta: "", data_emissao: hoje(), validade: "20 DIAS",
    cliente_id: "", cliente_nome: "", cliente_cnpj: "",
    cliente_endereco: "", cliente_contato: "", cliente_telefone: "",
    itens: [{ ...ITEM_VAZIO }],
    prazo_pagamento: "60 dias", frete: "CIF",
    prazo_entrega: "15 dias após confirmação",
    icms: "20%", ipi: 15,
    subtotal: 0, valor_ipi: 0, valor_total: 0,
    status: "PENDENTE", observacoes: "",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/orcamentos`, { headers });
      const data = await r.json();
      setOrcamentos(Array.isArray(data) ? data : []);
    } catch { setOrcamentos([]); }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchClientes = useCallback(async () => {
    try {
      const r = await fetch(`${API}/clientes`, { headers });
      const data = await r.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch { setClientes([]); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOrcamentos(); fetchClientes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clienteBusca.trim()) { setClienteSugestoes([]); return; }
    const q = clienteBusca.toLowerCase();
    setClienteSugestoes(clientes.filter(c => c.nome?.toLowerCase().includes(q) || c.cnpj?.includes(q)).slice(0, 6));
  }, [clienteBusca, clientes]);

  const selecionarCliente = (c) => {
    setForm(f => ({ ...f, cliente_id: c.id, cliente_nome: c.nome, cliente_cnpj: c.cnpj || "", cliente_endereco: c.endereco || "", cliente_contato: c.comprador || "", cliente_telefone: c.telefone || "" }));
    setClienteBusca(c.nome);
    setClienteSugestoes([]);
  };

  const recalcular = (itens, ipi) => {
    const sub = itens.reduce((a, it) => a + (Number(it.subtotal) || 0), 0);
    const vipi = sub * (Number(ipi) || 0) / 100;
    return { subtotal: sub, valor_ipi: vipi, valor_total: sub + vipi };
  };

  const atualizarItem = (idx, field, val) => {
    setForm(f => {
      const itens = [...f.itens];
      itens[idx] = { ...itens[idx], [field]: val };
      const q = Number(itens[idx].qtd_min) || 0;
      const p = Number(itens[idx].preco_milhar) || 0;
      itens[idx].subtotal = q * p;
      return { ...f, itens, ...recalcular(itens, f.ipi) };
    });
  };

  const addItem = () => setForm(f => ({ ...f, itens: [...f.itens, { ...ITEM_VAZIO }] }));
  const removeItem = (idx) => setForm(f => { const itens = f.itens.filter((_, i) => i !== idx); return { ...f, itens, ...recalcular(itens, f.ipi) }; });
  const setIpi = (val) => setForm(f => ({ ...f, ipi: val, ...recalcular(f.itens, val) }));

  const novoOrcamento = () => {
    setOrcamentoAtual(null); setClienteBusca("");
    setForm({ numero_proposta: "", data_emissao: hoje(), validade: "20 DIAS", cliente_id: "", cliente_nome: "", cliente_cnpj: "", cliente_endereco: "", cliente_contato: "", cliente_telefone: "", itens: [{ ...ITEM_VAZIO }], prazo_pagamento: "60 dias", frete: "CIF", prazo_entrega: "15 dias após confirmação", icms: "20%", ipi: 15, subtotal: 0, valor_ipi: 0, valor_total: 0, status: "PENDENTE", observacoes: "" });
    setView("form");
  };

  const editarOrcamento = (orc) => {
    setOrcamentoAtual(orc); setClienteBusca(orc.cliente_nome || "");
    setForm({ ...orc, itens: orc.itens?.length ? orc.itens : [{ ...ITEM_VAZIO }] });
    setView("form");
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const method = orcamentoAtual ? "PUT" : "POST";
      const url = orcamentoAtual ? `${API}/orcamentos/${orcamentoAtual.id}` : `${API}/orcamentos`;
      await fetch(url, { method, headers, body: JSON.stringify(form) });
      await fetchOrcamentos(); setView("lista");
    } catch (e) { alert("Erro ao salvar: " + e.message); }
    setSalvando(false);
  };

  const mudarStatus = async (id, status) => {
    await fetch(`${API}/orcamentos/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    fetchOrcamentos();
  };

  const deletar = async (id) => {
    if (!window.confirm("Remover este orçamento?")) return;
    await fetch(`${API}/orcamentos/${id}`, { method: "DELETE", headers });
    fetchOrcamentos();
  };

  const abrirEmail = (orc) => {
    const assunto = encodeURIComponent(`Proposta Comercial ${orc.numero_proposta} — Conpel`);
    const corpo = encodeURIComponent(`Prezado(a) ${orc.cliente_contato || orc.cliente_nome},\n\nSegue em anexo a proposta comercial ${orc.numero_proposta}, válida por ${orc.validade}.\n\nValor Total: ${brl(orc.valor_total)}\n\nCondições:\n- Prazo de Pagamento: ${orc.prazo_pagamento}\n- Frete: ${orc.frete}\n- Prazo de Entrega: ${orc.prazo_entrega}\n\nQualquer dúvida, estou à disposição.\n\nAtt,\nRubens Bandeira\nRepresentante Conpel\n(81) 97318-8452`);
    window.open(`mailto:?subject=${assunto}&body=${corpo}`);
    mudarStatus(orc.id, "ENVIADO");
  };

  const imprimir = (orc) => { setOrcamentoAtual(orc); setView("print"); setTimeout(() => window.print(), 400); };

  const filtrados = orcamentos.filter(o => {
    const q = busca.toLowerCase();
    const matchBusca = !q || o.numero_proposta?.toLowerCase().includes(q) || o.cliente_nome?.toLowerCase().includes(q);
    const matchStatus = filtroStatus === "TODOS" || o.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // ── PRINT VIEW — mantém cores da Conpel ──────────────────
  if (view === "print" && orcamentoAtual) {
    const o = orcamentoAtual;
    return (
      <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 800, margin: "0 auto", background: "white", padding: 20 }}>
        <style>{`@media print { @page { size: A4 portrait; margin: 8mm; } body { background: white !important; } .no-print { display: none !important; } }`}</style>
        <div className="no-print flex gap-2 mb-4">
          <button onClick={() => setView("lista")} style={{ padding: "8px 20px", background: "#0A3D73", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>← Voltar</button>
          <button onClick={() => window.print()} style={{ padding: "8px 20px", background: "#166534", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>🖨 Imprimir / PDF</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 180px", alignItems: "center", borderBottom: "3px solid #7C4F1E", paddingBottom: 12 }}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="Conpel" style={{ height: 46, width: "auto" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#5A3610" }}>CONPEL — Companhia Nordestina de Papel</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>BR 101, Km 06, Conde/PB · (83) 3690-6270 · www.novaconpel.com.br</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Proposta Nº</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#7C4F1E" }}>{o.numero_proposta}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, background: "#F7F0E8", padding: "7px 16px", fontSize: 11, borderBottom: "1px solid #DEC9AD" }}>
          <span><strong>Data Emissão:</strong> {o.data_emissao?.split("-").reverse().join("/")}</span>
          <span><strong>Validade:</strong> {o.validade}</span>
        </div>
        <div style={{ background: "#A0682E", color: "white", padding: "7px 16px", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Dados do Cliente</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", padding: "12px 16px", borderBottom: "1px solid #E4E4E7", fontSize: 11 }}>
          <div><span style={{ color: "#888", fontSize: 9, textTransform: "uppercase" }}>Razão Social</span><br /><strong>{o.cliente_nome}</strong></div>
          <div><span style={{ color: "#888", fontSize: 9, textTransform: "uppercase" }}>CNPJ</span><br /><strong>{o.cliente_cnpj}</strong></div>
          <div style={{ gridColumn: "1/-1" }}><span style={{ color: "#888", fontSize: 9, textTransform: "uppercase" }}>Endereço</span><br /><strong>{o.cliente_endereco}</strong></div>
          <div><span style={{ color: "#888", fontSize: 9, textTransform: "uppercase" }}>Contato</span><br /><strong>{o.cliente_contato}</strong></div>
          <div><span style={{ color: "#888", fontSize: 9, textTransform: "uppercase" }}>Telefone</span><br /><strong>{o.cliente_telefone}</strong></div>
        </div>
        <div style={{ background: "#A0682E", color: "white", padding: "7px 16px", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Itens do Orçamento</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead><tr style={{ background: "#5A3610", color: "white" }}>{["Nº","FE","Descrição","Medidas","Unid.","Qtd. Mín.","Preço/Milh.","Subtotal"].map(h => <th key={h} style={{ padding: "7px 6px", textAlign: "center", fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>{(o.itens || []).map((it, i) => (<tr key={i} style={{ borderBottom: "1px solid #F4F4F5", background: i % 2 === 0 ? "white" : "#FAFAFA" }}><td style={{ textAlign: "center", padding: "6px 4px", fontWeight: 700, color: "#A0682E" }}>{i+1}</td><td style={{ padding: "6px 4px" }}>{it.fe}</td><td style={{ padding: "6px 4px" }}>{it.descricao}</td><td style={{ padding: "6px 4px" }}>{it.medidas}</td><td style={{ textAlign: "center", padding: "6px 4px" }}>{it.unidade}</td><td style={{ textAlign: "center", padding: "6px 4px" }}>{it.qtd_min?.toLocaleString("pt-BR")}</td><td style={{ textAlign: "right", padding: "6px 4px" }}>{brl(it.preco_milhar)}</td><td style={{ textAlign: "right", padding: "6px 4px", fontWeight: 700, color: "#7C4F1E" }}>{it.subtotal > 0 ? brl(it.subtotal) : "—"}</td></tr>))}</tbody>
        </table>
        <div style={{ background: "#FFFBEB", borderTop: "1px solid #FDE68A", borderBottom: "1px solid #FDE68A", padding: "8px 16px", fontSize: 10, color: "#78350F" }}>⚠ <strong>Tolerância de produção:</strong> As quantidades entregues e a gramatura podem sofrer variação de <strong>±10%</strong>.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #E4E4E7" }}>
          <div style={{ padding: "14px 16px", borderRight: "1px solid #E4E4E7", fontSize: 10 }}>
            <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#A0682E", marginBottom: 8, fontSize: 9 }}>Condições Comerciais</div>
            <div>- Prazo Pagamento: <strong>{o.prazo_pagamento}</strong></div>
            <div>- Frete: <strong>{o.frete}</strong></div>
            <div>- Prazo Entrega: <strong>{o.prazo_entrega}</strong></div>
            <div>- ICMS: <strong>{o.icms}</strong> Incluso no preço</div>
            <div>- IPI: <strong>{o.ipi}%</strong> Não incluso</div>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>Subtotal</span><strong>{brl(o.subtotal)}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#666" }}>IPI ({o.ipi}%)</span><strong>{brl(o.valor_ipi)}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #DEC9AD", paddingTop: 8, marginTop: 4 }}><strong style={{ color: "#5A3610", fontSize: 14 }}>Valor Total</strong><strong style={{ color: "#7C4F1E", fontSize: 16 }}>{brl(o.valor_total)}</strong></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "12px 16px", borderTop: "1px solid #E4E4E7", background: "#FAFAFA", fontSize: 10, color: "#666" }}>
          <div>Representante Conpel: <strong>Rubens Bandeira</strong> · (81) 97318-8452</div>
          <div><div style={{ borderTop: "1px solid #999", marginTop: 28, paddingTop: 4, width: 180, textAlign: "center" }}>Aprovação do Cliente / Assinatura</div></div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, padding: "10px 16px", background: "#EAF2E9", borderTop: "2px solid #3A6B35", fontSize: 10, color: "#3A6B35", fontWeight: 600 }}>
          {["Mais de 50 anos de tradição","Qualidade e Tecnologia em Embalagens","Soluções Personalizadas para Você"].map(s => <span key={s}>✓ {s}</span>)}
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO — cores RepFlow ────────────────────────────
  if (view === "form") {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto bg-[#E9EEF2] min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{orcamentoAtual ? "Editar Orçamento" : "Novo Orçamento"}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Preencha os dados e salve</p>
          </div>
          <button onClick={() => setView("lista")} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors">
            <X size={14} /> Cancelar
          </button>
        </div>

        {/* Proposta */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0A3D73] mb-4 pb-2 border-b border-slate-100">01 · Dados da Proposta</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[["Nº Proposta","numero_proposta","text","PROP-..."],["Data Emissão","data_emissao","date",""],["Validade","validade","text","20 DIAS"]].map(([l,k,t,ph]) => (
              <div key={k}><label className={lbl}>{l}</label><input type={t} className={inp} placeholder={ph} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} /></div>
            ))}
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0A3D73] mb-4 pb-2 border-b border-slate-100">02 · Dados do Cliente</h3>
          <div className="relative mb-4">
            <label className={lbl}>Buscar Cliente</label>
            <div className="flex items-center border-b border-slate-200 gap-2 pb-1">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input type="text" className="flex-1 bg-transparent text-sm outline-none text-slate-800 font-semibold" placeholder="Digite o nome ou CNPJ..." value={clienteBusca} onChange={e => setClienteBusca(e.target.value)} />
            </div>
            {clienteSugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-auto">
                {clienteSugestoes.map(c => (
                  <button key={c.id} onClick={() => selecionarCliente(c)} className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors">
                    <span className="font-black text-slate-800">{c.nome}</span>
                    <span className="text-slate-400 ml-2">{c.cnpj}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[["Razão Social","cliente_nome"],["CNPJ","cliente_cnpj"],["Endereço","cliente_endereco"],["Contato","cliente_contato"]].map(([l,k]) => (
              <div key={k}><label className={lbl}>{l}</label><input type="text" className={inp} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} /></div>
            ))}
            <div><label className={lbl}>Telefone</label><input type="text" className={inp} value={form.cliente_telefone} maxLength={15} onChange={e => setForm(f => ({...f, cliente_telefone: mascaraTel(e.target.value)}))} /></div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4 overflow-x-auto">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0A3D73] mb-4 pb-2 border-b border-slate-100">03 · Itens do Orçamento</h3>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-[#0A3D73] text-white">
                {["Nº","FE","Descrição","Medidas","Unid.","Qtd. Mín.","Preço/Milh.","Subtotal",""].map((h,i) => (
                  <th key={i} className="px-2 py-2.5 text-center font-bold tracking-wide" style={{fontSize:9, textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.itens.map((it, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                  <td className="px-1 py-1 text-center font-black text-[#0A3D73] text-xs w-8">{idx+1}</td>
                  {[["fe","FE código","w-24"],["descricao","Descrição","w-32"],["medidas","350 x 250 x 210","w-32"],["unidade","Mil","w-12"]].map(([k,ph,w]) => (
                    <td key={k} className={`px-1 py-1 ${w}`}>
                      <input type="text" className="w-full bg-transparent border border-transparent rounded-lg px-1.5 py-1 text-xs outline-none focus:bg-white focus:border-[#0A3D73]/30 transition-all" placeholder={ph} value={it[k]} onChange={e => atualizarItem(idx, k, e.target.value)} />
                    </td>
                  ))}
                  <td className="px-1 py-1 w-16">
                    <input type="number" className="w-full bg-transparent border border-transparent rounded-lg px-1.5 py-1 text-xs text-center outline-none focus:bg-white focus:border-[#0A3D73]/30 transition-all" placeholder="0" value={it.qtd_min} onChange={e => atualizarItem(idx, "qtd_min", e.target.value)} />
                  </td>
                  <td className="px-1 py-1 w-24">
                    <input type="number" className="w-full bg-transparent border border-transparent rounded-lg px-1.5 py-1 text-xs text-right outline-none focus:bg-white focus:border-[#0A3D73]/30 transition-all" placeholder="0,00" step="0.01" value={it.preco_milhar} onChange={e => atualizarItem(idx, "preco_milhar", e.target.value)} />
                  </td>
                  <td className="px-2 py-1 text-right font-black text-[#0A3D73] text-xs whitespace-nowrap">{it.subtotal > 0 ? brl(it.subtotal) : "—"}</td>
                  <td className="px-1 py-1 text-center w-7">
                    {form.itens.length > 1 && <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addItem} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0A3D73] border border-dashed border-[#0A3D73]/30 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors">
            <PlusCircle size={14} /> Adicionar Item
          </button>
          <div className="mt-4 flex justify-end">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 w-64 flex flex-col gap-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><strong className="text-slate-800">{brl(form.subtotal)}</strong></div>
              <div className="flex justify-between text-sm items-center gap-2">
                <span className="text-slate-500 whitespace-nowrap">IPI</span>
                <div className="flex items-center gap-1">
                  <input type="number" className="w-14 text-center text-xs border border-slate-200 rounded-lg px-1 py-0.5 outline-none focus:border-[#0A3D73]" value={form.ipi} step="0.01" onChange={e => setIpi(e.target.value)} />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <strong className="text-slate-800">{brl(form.valor_ipi)}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-[#0A3D73]/20">
                <strong className="text-[#0A3D73] text-sm">Valor Total</strong>
                <strong className="text-[#0A3D73] text-lg">{brl(form.valor_total)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Condições */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0A3D73] mb-4 pb-2 border-b border-slate-100">04 · Condições Comerciais</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[["Prazo Pagamento","prazo_pagamento"],["Frete","frete"],["Prazo Entrega","prazo_entrega"],["ICMS","icms"],["Observações","observacoes"]].map(([l,k]) => (
              <div key={k} className={k==="observacoes" ? "col-span-2 md:col-span-3" : ""}>
                <label className={lbl}>{l}</label>
                <input type="text" className={inp} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={() => setView("lista")} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="px-6 py-2.5 text-xs font-black text-white bg-[#0A3D73] rounded-xl hover:bg-[#082D54] disabled:opacity-50 transition-colors shadow-sm uppercase tracking-wide">
            {salvando ? "Salvando..." : orcamentoAtual ? "Salvar Alterações" : "Criar Orçamento"}
          </button>
        </div>
      </div>
    );
  }

  // ── LISTA — cores RepFlow ────────────────────────────────
  return (
    <div className="p-4 md:p-6 bg-[#E9EEF2] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orçamentos</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{orcamentos.length} proposta{orcamentos.length !== 1 ? "s" : ""} cadastrada{orcamentos.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={novoOrcamento} className="flex items-center gap-2 bg-[#0A3D73] hover:bg-[#082D54] text-white font-black text-xs uppercase px-5 py-2.5 rounded-lg shadow-sm transition-colors">
          <PlusCircle size={14} /> Novo Orçamento
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 shadow-sm">
          <Search size={13} className="text-slate-400" />
          <input type="text" placeholder="Buscar por proposta ou cliente..." className="flex-1 text-xs font-semibold outline-none bg-transparent text-slate-700" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["TODOS","PENDENTE","ENVIADO","APROVADO","RECUSADO"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filtroStatus === s ? "bg-[#0A3D73] text-white border-[#0A3D73] shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-[#0A3D73]"}`}>
              {s === "TODOS" ? "Todos" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-[#0A3D73] border-t-transparent rounded-full animate-spin mr-3"/>
          <span className="text-xs font-black uppercase tracking-widest">Carregando...</span>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(orc => {
            const sc = STATUS_CONFIG[orc.status] || STATUS_CONFIG.PENDENTE;
            const Icon = sc.icon;
            return (
              <div key={orc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-[#0A3D73]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-800 text-sm">{orc.numero_proposta}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                          <Icon size={10} />{sc.label}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5 font-semibold">{orc.cliente_nome}</div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400">{orc.data_emissao?.split("-").reverse().join("/")}</span>
                        <span className="text-xs text-slate-400">Validade: {orc.validade}</span>
                        <span className="text-xs font-black text-[#0A3D73]">{brl(orc.valor_total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <select value={orc.status} onChange={e => mudarStatus(orc.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white text-slate-600 cursor-pointer hover:border-[#0A3D73] transition-colors font-bold">
                      {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => editarOrcamento(orc)} className="p-1.5 text-slate-400 hover:text-[#0A3D73] hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={14} /></button>
                    <button onClick={() => imprimir(orc)} className="p-1.5 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Imprimir"><Printer size={14} /></button>
                    <button onClick={() => abrirEmail(orc)} className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="E-mail"><Send size={14} /></button>
                    <button onClick={() => deletar(orc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}