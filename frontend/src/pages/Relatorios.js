import React, { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  DollarSign, Users, Package, RefreshCw, TrendingUp, Clock, FileText,
  ArrowRight, X, Printer, ChevronUp, ChevronDown, Minus
} from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const brl = (v) => Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const num = (v) => Number(v||0).toLocaleString("pt-BR");
const pct = (v) => `${Number(v||0).toFixed(1)}%`;

// ── cores RepFlow ──
const C = {
  azul: "#0A3D73", azulM: "#4A90D9", cinza: "#E9EEF2",
  verde: "#166534", verdeL: "#DCFCE7",
  amarelo: "#92400E", amareloL: "#FEF3C7",
  vermelho: "#991B1B", vermelhoL: "#FEE2E2",
  branco: "#FFFFFF",
};

// ── ANO ATUAL ──
const ANO_ATUAL = new Date().getFullYear();

export default function Relatorios() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [pedidos, setPedidos]   = useState([]);
  const [clientes, setClientes] = useState([]);
  const [notas, setNotas]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [anoFiltro, setAnoFiltro] = useState(ANO_ATUAL);
  const [telaAtiva, setTelaAtiva] = useState(null); // null = cards
  const printRef = useRef();

  // ── fetch ──────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const [rP, rC, rN] = await Promise.all([
          fetch(`${API}/pedidos`, { headers }),
          fetch(`${API}/clientes`, { headers }),
          fetch(`${API}/notas-fiscais`, { headers }),
        ]);
        const pData = await rP.json();
        const cData = await rC.json();
        const nData = await rN.json();
        setPedidos(Array.isArray(pData) ? pData : []);
        setClientes(Array.isArray(cData) ? cData : []);
        setNotas(Array.isArray(nData) ? nData : []);
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    fetch_(); // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── dados processados ──────────────────────────────────
  const pedidosAno = pedidos.filter(p => {
    const ano = p.criado_em?.substring(0,4);
    return ano === String(anoFiltro);
  });

  const notasAno = notas.filter(n => {
    const ano = (n.data_emissao || n.criado_em || "").substring(0,4);
    return ano === String(anoFiltro);
  });

  // faturamento total
  const faturamentoTotal = notasAno.reduce((a,n) => a + (n.valor_total||0), 0);

  // pedidos em aberto
  const pedidosAberto = pedidos.filter(p => ["PENDENTE","IMPLANTADO"].includes(p.status));

  // clientes ativos no ano
  const clientesAtivosSet = new Set(pedidosAno.map(p => p.cliente_nome));
  const clientesAtivos = clientesAtivosSet.size;

  // ticket médio
  const ticketMedio = notasAno.length ? faturamentoTotal / notasAno.length : 0;

  // ── 1. Vendas por cliente (comparativo mensal) ─────────
  const vendasPorCliente = () => {
    const mapa = {};
    pedidosAno.forEach(p => {
      const c = p.cliente_nome || "S/N";
      const mes = parseInt((p.criado_em||"").substring(5,7)) - 1;
      if (!mapa[c]) mapa[c] = { total: 0, meses: Array(12).fill(0) };
      mapa[c].total += p.valor_total||0;
      if (mes >= 0 && mes < 12) mapa[c].meses[mes] += p.valor_total||0;
    });
    const total = Object.values(mapa).reduce((a,v) => a + v.total, 0);
    return Object.entries(mapa)
      .map(([nome, d]) => ({ nome, ...d, participacao: total ? d.total/total*100 : 0 }))
      .sort((a,b) => b.total - a.total);
  };

  // ── 2. Faturamento por mês ────────────────────────────
  const faturamentoPorMes = () => {
    const arr = Array(12).fill(0);
    notasAno.forEach(n => {
      const mes = parseInt((n.data_emissao || n.criado_em || "").substring(5,7)) - 1;
      if (mes >= 0 && mes < 12) arr[mes] += n.valor_total||0;
    });
    return MESES.map((m,i) => ({ mes: m, valor: arr[i] }));
  };

  // ── 3. Produtos mais vendidos ─────────────────────────
  const produtosMaisVendidos = () => {
    const mapa = {};
    pedidosAno.forEach(p => {
      const nome = p.item_nome || p.numero_fe || "S/N";
      if (!mapa[nome]) mapa[nome] = { quantidade: 0, valor: 0 };
      mapa[nome].quantidade += p.quantidade||0;
      mapa[nome].valor += p.valor_total||0;
    });
    return Object.entries(mapa)
      .map(([nome, d]) => ({ nome, ...d }))
      .sort((a,b) => b.valor - a.valor)
      .slice(0, 15);
  };

  // ── 4. Frequência de compra ───────────────────────────
  const frequenciaCompra = () => {
    const mapa = {};
    pedidos.forEach(p => {
      const c = p.cliente_nome || "S/N";
      if (!mapa[c]) mapa[c] = { pedidos: [], datas: [] };
      mapa[c].pedidos.push(p);
      if (p.criado_em) mapa[c].datas.push(new Date(p.criado_em));
    });
    return Object.entries(mapa).map(([nome, d]) => {
      const datas = d.datas.sort((a,b) => a-b);
      let cicloMedio = 0;
      if (datas.length > 1) {
        const diffs = [];
        for (let i=1; i<datas.length; i++) diffs.push((datas[i]-datas[i-1])/(1000*60*60*24));
        cicloMedio = diffs.reduce((a,v) => a+v, 0) / diffs.length;
      }
      const ultimaCompra = datas[datas.length-1];
      const diasSemComprar = ultimaCompra ? Math.floor((new Date()-ultimaCompra)/(1000*60*60*24)) : 999;
      return { nome, totalPedidos: d.pedidos.length, cicloMedio: Math.round(cicloMedio), diasSemComprar, ultimaCompra: ultimaCompra?.toLocaleDateString("pt-BR") || "-" };
    }).sort((a,b) => b.totalPedidos - a.totalPedidos);
  };

  // ── 5. Curva ABC ──────────────────────────────────────
  const curvaABC = () => {
    const dados = vendasPorCliente();
    const total = dados.reduce((a,d) => a + d.total, 0);
    let acumulado = 0;
    return dados.map(d => {
      acumulado += d.total;
      const pctAcum = total ? acumulado/total*100 : 0;
      const classe = pctAcum <= 80 ? "A" : pctAcum <= 95 ? "B" : "C";
      return { ...d, pctAcumulado: pctAcum, classe };
    });
  };

  // ── 6. Clientes inativos ──────────────────────────────
  const clientesInativos = () => {
    const freq = frequenciaCompra();
    return freq
      .filter(c => c.diasSemComprar > 60)
      .sort((a,b) => b.diasSemComprar - a.diasSemComprar);
  };

  // ── 7. Pedidos em aberto ──────────────────────────────
  const pedidosEmAberto = () => {
    return pedidosAberto.sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em));
  };

  // ── imprimir ──────────────────────────────────────────
  const imprimir = () => window.print();

  // ── TELAS DETALHADAS ─────────────────────────────────
  const renderDetalhe = () => {
    const voltar = (
      <div className="flex items-center justify-between mb-6 no-print">
        <button onClick={() => setTelaAtiva(null)}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <X size={16}/> Fechar
        </button>
        <button onClick={imprimir}
          className="flex items-center gap-2 text-sm font-bold text-white bg-[#0A3D73] px-4 py-2 rounded-lg hover:bg-[#4A90D9] transition-colors">
          <Printer size={14}/> Imprimir / Exportar
        </button>
      </div>
    );

    // ── DETALHE 1: Comparativo Mensal ──
    if (telaAtiva === "vendas") {
      const dados = vendasPorCliente();
      const totaisMes = Array(12).fill(0);
      dados.forEach(d => d.meses.forEach((v,i) => totaisMes[i] += v));
      const totalGeral = totaisMes.reduce((a,v) => a+v, 0);
      return (
        <div ref={printRef} className="p-6 max-w-7xl mx-auto">
          {voltar}
          <div className="print-header" style={{display:"none"}}>
            <h1 style={{fontSize:18,fontWeight:800,color:"#0A3D73"}}>Comparativo Mensal de Vendas {anoFiltro}</h1>
            <p style={{fontSize:11,color:"#666"}}>Vendedor: Rubens Bandeira · RepFlow</p>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-1">Comparativo Mensal de Vendas</h2>
          <p className="text-sm text-slate-500 mb-6">{anoFiltro} · {dados.length} clientes</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-xs border-collapse" style={{minWidth:1100}}>
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  <th className="px-3 py-3 text-left font-black uppercase tracking-wide sticky left-0" style={{background:"#0A3D73",minWidth:160}}>Cliente</th>
                  {MESES.map(m => <th key={m} className="px-2 py-3 text-right font-black uppercase tracking-wide" style={{minWidth:72}}>{m}</th>)}
                  <th className="px-3 py-3 text-right font-black uppercase tracking-wide" style={{minWidth:90}}>Total</th>
                  <th className="px-3 py-3 text-right font-black uppercase tracking-wide" style={{minWidth:60}}>Média</th>
                  <th className="px-3 py-3 text-right font-black uppercase tracking-wide" style={{minWidth:60}}>Part.%</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((d,i) => (
                  <tr key={d.nome} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                    <td className="px-3 py-2 font-bold text-slate-800 sticky left-0" style={{background:i%2===0?"white":"#F8FAFC"}}>{d.nome}</td>
                    {d.meses.map((v,j) => (
                      <td key={j} className="px-2 py-2 text-right text-slate-600">
                        {v > 0 ? <span className="font-semibold text-slate-800">{num(Math.round(v))}</span> : <span className="text-slate-300">-</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-black text-[#0A3D73]">{num(Math.round(d.total))}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{num(Math.round(d.total/12))}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-700">{pct(d.participacao)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  <td className="px-3 py-2.5 font-black uppercase tracking-wide sticky left-0" style={{background:"#0A3D73"}}>TOTAL</td>
                  {totaisMes.map((v,i) => <td key={i} className="px-2 py-2.5 text-right font-black">{v > 0 ? num(Math.round(v)) : "-"}</td>)}
                  <td className="px-3 py-2.5 text-right font-black">{num(Math.round(totalGeral))}</td>
                  <td className="px-3 py-2.5 text-right font-black">{num(Math.round(totalGeral/12))}</td>
                  <td className="px-3 py-2.5 text-right font-black">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }

    // ── DETALHE 2: Faturamento por período ──
    if (telaAtiva === "faturamento") {
      const dados = faturamentoPorMes();
      const maiorMes = dados.reduce((a,d) => d.valor > a.valor ? d : a, dados[0]);
      return (
        <div ref={printRef} className="p-6 max-w-5xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Faturamento por Período</h2>
          <p className="text-sm text-slate-500 mb-6">{anoFiltro}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Ano</p>
              <p className="text-2xl font-black text-[#0A3D73] mt-1">{brl(faturamentoTotal)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Melhor Mês</p>
              <p className="text-2xl font-black text-green-700 mt-1">{maiorMes?.mes}</p>
              <p className="text-sm text-slate-500">{brl(maiorMes?.valor)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Média Mensal</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{brl(faturamentoTotal/12)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dados} margin={{top:10,right:20,bottom:0,left:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                <XAxis dataKey="mes" tick={{fontSize:11,fontWeight:700}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v => brl(v)} labelStyle={{fontWeight:700}}/>
                <Bar dataKey="valor" fill="#0A3D73" radius={[4,4,0,0]} name="Faturamento"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // ── DETALHE 3: Produtos mais vendidos ──
    if (telaAtiva === "produtos") {
      const dados = produtosMaisVendidos();
      const totalVal = dados.reduce((a,d) => a + d.valor, 0);
      return (
        <div ref={printRef} className="p-6 max-w-4xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Produtos Mais Vendidos</h2>
          <p className="text-sm text-slate-500 mb-6">{anoFiltro}</p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">#</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">Produto</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wide text-xs">Qtd.</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wide text-xs">Valor</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wide text-xs">Part.%</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((d,i) => (
                  <tr key={d.nome} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                    <td className="px-4 py-2.5 font-black text-slate-400 text-xs">{i+1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{d.nome}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{num(d.quantidade)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#0A3D73]">{brl(d.valor)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{pct(totalVal ? d.valor/totalVal*100 : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── DETALHE 4: Frequência de compra ──
    if (telaAtiva === "frequencia") {
      const dados = frequenciaCompra();
      return (
        <div ref={printRef} className="p-6 max-w-5xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Frequência de Compra</h2>
          <p className="text-sm text-slate-500 mb-6">Ciclo médio e última compra por cliente</p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  {["Cliente","Nº Pedidos","Ciclo Médio (dias)","Última Compra","Dias sem comprar","Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((d,i) => {
                  const status = d.diasSemComprar > 90 ? {label:"Crítico",bg:"#FEE2E2",color:"#991B1B"} :
                                 d.diasSemComprar > 60 ? {label:"Atenção",bg:"#FEF3C7",color:"#92400E"} :
                                 {label:"Ativo",bg:"#DCFCE7",color:"#166534"};
                  return (
                    <tr key={d.nome} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{d.nome}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-[#0A3D73]">{d.totalPedidos}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{d.cicloMedio > 0 ? `${d.cicloMedio} dias` : "-"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.ultimaCompra}</td>
                      <td className="px-4 py-2.5 text-center font-bold" style={{color: d.diasSemComprar > 60 ? "#991B1B" : "#166534"}}>{d.diasSemComprar} dias</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black px-2 py-1 rounded-full" style={{background:status.bg,color:status.color}}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── DETALHE 5: Curva ABC ──
    if (telaAtiva === "abc") {
      const dados = curvaABC();
      const qtdA = dados.filter(d => d.classe==="A").length;
      const qtdB = dados.filter(d => d.classe==="B").length;
      const qtdC = dados.filter(d => d.classe==="C").length;
      return (
        <div ref={printRef} className="p-6 max-w-4xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Curva ABC de Clientes</h2>
          <p className="text-sm text-slate-500 mb-4">{anoFiltro}</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{cl:"A",desc:"Top 80% do faturamento",qt:qtdA,bg:"#DCFCE7",cor:"#166534"},
              {cl:"B",desc:"80–95% do faturamento",qt:qtdB,bg:"#FEF3C7",cor:"#92400E"},
              {cl:"C",desc:"Últimos 5%",qt:qtdC,bg:"#FEE2E2",cor:"#991B1B"}].map(x => (
              <div key={x.cl} className="rounded-xl border p-4 shadow-sm" style={{background:x.bg,borderColor:x.cor+"33"}}>
                <div className="text-3xl font-black" style={{color:x.cor}}>Classe {x.cl}</div>
                <div className="text-2xl font-black mt-1" style={{color:x.cor}}>{x.qt} clientes</div>
                <div className="text-xs font-bold mt-1" style={{color:x.cor}}>{x.desc}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  {["#","Cliente","Faturamento","Part.%","Acumulado%","Classe"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((d,i) => {
                  const cores = {A:{bg:"#DCFCE7",cor:"#166534"},B:{bg:"#FEF3C7",cor:"#92400E"},C:{bg:"#FEE2E2",cor:"#991B1B"}};
                  const c = cores[d.classe];
                  return (
                    <tr key={d.nome} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                      <td className="px-4 py-2.5 font-black text-slate-400 text-xs">{i+1}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{d.nome}</td>
                      <td className="px-4 py-2.5 font-bold text-[#0A3D73]">{brl(d.total)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{pct(d.participacao)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{pct(d.pctAcumulado)}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:c.bg,color:c.cor}}>Classe {d.classe}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── DETALHE 6: Clientes inativos ──
    if (telaAtiva === "inativos") {
      const dados = clientesInativos();
      return (
        <div ref={printRef} className="p-6 max-w-4xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Clientes para Reativação</h2>
          <p className="text-sm text-slate-500 mb-6">Sem compras há mais de 60 dias · {dados.length} clientes</p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  {["Cliente","Última Compra","Dias Parado","Nº Pedidos","Prioridade"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((d,i) => {
                  const prior = d.diasSemComprar > 180 ? {label:"🔴 Urgente",bg:"#FEE2E2",cor:"#991B1B"} :
                                d.diasSemComprar > 90  ? {label:"🟡 Alto",bg:"#FEF3C7",cor:"#92400E"} :
                                {label:"🟢 Normal",bg:"#DCFCE7",cor:"#166534"};
                  return (
                    <tr key={d.nome} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{d.nome}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.ultimaCompra}</td>
                      <td className="px-4 py-2.5 font-bold text-red-700">{d.diasSemComprar} dias</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{d.totalPedidos}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:prior.bg,color:prior.cor}}>{prior.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── DETALHE 7: Pedidos em aberto ──
    if (telaAtiva === "aberto") {
      const dados = pedidosEmAberto();
      const totalAberto = dados.reduce((a,p) => a + (p.valor_total||0), 0);
      return (
        <div ref={printRef} className="p-6 max-w-5xl mx-auto">
          {voltar}
          <h2 className="text-xl font-black text-slate-800 mb-1">Pedidos em Aberto</h2>
          <p className="text-sm text-slate-500 mb-4">{dados.length} pedidos · {brl(totalAberto)} em aberto</p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#0A3D73",color:"white"}}>
                  {["OC","Cliente","Produto","Data","Valor","Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-wide text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((p,i) => {
                  const st = p.status === "PENDENTE"
                    ? {bg:"#FEF3C7",cor:"#92400E"}
                    : {bg:"#DBEAFE",cor:"#1E40AF"};
                  return (
                    <tr key={p.id||i} className={i%2===0?"bg-white":"bg-slate-50"} style={{borderBottom:"1px solid #F1F5F9"}}>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.numero_oc||"-"}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.cliente_nome}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.item_nome||p.numero_fe||"-"}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "-"}</td>
                      <td className="px-4 py-2.5 font-bold text-[#0A3D73]">{brl(p.valor_total)}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:st.bg,color:st.cor}}>{p.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  // ── CARDS PRINCIPAIS ──────────────────────────────────
  const relatorios = [
    {
      id: "vendas", icon: TrendingUp, cor: C.azul, corL: "#EFF6FF",
      titulo: "Vendas por Cliente",
      desc: "Comparativo mensal igual ao relatório da Conpel",
      valor: brl(faturamentoTotal), label: "faturado no ano",
    },
    {
      id: "faturamento", icon: DollarSign, cor: "#166534", corL: C.verdeL,
      titulo: "Faturamento por Período",
      desc: "Evolução mês a mês com gráfico de barras",
      valor: brl(ticketMedio), label: "ticket médio por NF",
    },
    {
      id: "produtos", icon: Package, cor: "#7C3AED", corL: "#F5F3FF",
      titulo: "Produtos Mais Vendidos",
      desc: "Ranking por valor e quantidade",
      valor: `${produtosMaisVendidos().length} SKUs`, label: "produtos diferentes",
    },
    {
      id: "frequencia", icon: RefreshCw, cor: "#0891B2", corL: "#ECFEFF",
      titulo: "Frequência de Compra",
      desc: "Ciclo médio e dias desde a última compra",
      valor: `${clientesAtivos} ativos`, label: `de ${clientes.length} clientes`,
    },
    {
      id: "abc", icon: TrendingUp, cor: "#D97706", corL: C.amareloL,
      titulo: "Curva ABC de Clientes",
      desc: "Classifica clientes por participação no faturamento",
      valor: pct(curvaABC().filter(d=>d.classe==="A").reduce((a,d)=>a+d.participacao,0)), label: "dos clientes classe A",
    },
    {
      id: "inativos", icon: Clock, cor: "#DC2626", corL: C.vermelhoL,
      titulo: "Clientes para Reativação",
      desc: "Sem compras há mais de 60 dias",
      valor: `${clientesInativos().length} clientes`, label: "precisam de contato",
    },
    {
      id: "aberto", icon: FileText, cor: "#0A3D73", corL: "#EFF6FF",
      titulo: "Pedidos em Aberto",
      desc: "Pendentes e implantados aguardando faturamento",
      valor: `${pedidosAberto.length} pedidos`, label: `${brl(pedidosAberto.reduce((a,p)=>a+(p.valor_total||0),0))} em aberto`,
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0A3D73] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm font-bold">Carregando relatórios...</p>
      </div>
    </div>
  );

  if (telaAtiva) return (
    <div className="min-h-full bg-[#E9EEF2]">
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 10mm; size: A4 landscape; } }`}</style>
      {renderDetalhe()}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão estratégica do seu negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ano</label>
          <select value={anoFiltro} onChange={e => setAnoFiltro(Number(e.target.value))}
            className="text-sm font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none bg-white text-slate-700 hover:border-[#4A90D9] transition-colors">
            {[ANO_ATUAL-1, ANO_ATUAL, ANO_ATUAL+1].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* cards KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {label:"Faturamento Ano",valor:brl(faturamentoTotal),cor:"#0A3D73"},
          {label:"Clientes Ativos",valor:clientesAtivos,cor:"#166534"},
          {label:"Pedidos em Aberto",valor:pedidosAberto.length,cor:"#D97706"},
          {label:"Ticket Médio",valor:brl(ticketMedio),cor:"#7C3AED"},
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
            <p className="text-xl font-black mt-1" style={{color:k.cor}}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* gráfico rápido faturamento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <h3 className="text-sm font-black text-slate-700 mb-4 uppercase tracking-wide">Faturamento Mensal {anoFiltro}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={faturamentoPorMes()} margin={{top:0,right:10,bottom:0,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="mes" tick={{fontSize:11,fontWeight:700}}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={v => brl(v)} labelStyle={{fontWeight:700}}/>
            <Bar dataKey="valor" fill="#0A3D73" radius={[4,4,0,0]} name="Faturamento"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* cards relatórios */}
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Relatórios Detalhados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatorios.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setTelaAtiva(r.id)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:r.corL}}>
                    <Icon size={18} style={{color:r.cor}}/>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all mt-1"/>
                </div>
                <h3 className="font-black text-slate-800 text-sm mb-1">{r.titulo}</h3>
                <p className="text-xs text-slate-400 mb-4">{r.desc}</p>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-lg font-black" style={{color:r.cor}}>{r.valor}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}