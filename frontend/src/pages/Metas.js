import React, { useState, useEffect } from 'react';
// 1. Trocamos o axios puro pelo nosso serviço configurado
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Target, Weight, TrendingUp, Users, CalendarDays, ChevronRight, PlusCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Metas = () => {
  const { isAdmin } = useAuth();
  
  const [clientes, setClientes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [faturamento, setFaturamento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [novaMeta, setNovaMeta] = useState({ 
    cliente_id: '', 
    mes: (new Date().getMonth() + 1).toString(), 
    valor_ton: '' 
  });

  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 2. Chamadas usando o serviço centralizado 'api'
      const [cliRes, metaRes, fatRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/metas'),
        api.get('/notas-fiscais')
      ]);
      setClientes(cliRes.data);
      setMetas(metaRes.data);
      setFaturamento(fatRes.data);
    } catch (error) {
      toast.error("Erro ao sincronizar dados de performance");
    } finally { setLoading(false); }
  };

  const salvarMeta = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error("Apenas administradores podem definir metas");
      return;
    }

    if (!novaMeta.cliente_id || !novaMeta.valor_ton) {
      return toast.error("Selecione o cliente e a tonelagem");
    }

    try {
      // 3. POST usando o serviço centralizado
      await api.post('/metas', {
        ...novaMeta,
        ano: 2026
      });
      toast.success("Planejamento atualizado!");
      setIsModalAberto(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar meta");
    }
  };

  const calcularProgressoCliente = (clienteId) => {
    const metaObj = metas.find(m => m.cliente_id === clienteId && m.mes === selectedMonth);
    const metaTon = metaObj ? parseFloat(metaObj.valor_ton) : 0;
    
    const realizadoTon = faturamento
      .filter(nf => nf.cliente_id === clienteId && (new Date(nf.data_emissao).getMonth() + 1).toString() === selectedMonth)
      .reduce((acc, nf) => acc + (parseFloat(nf.peso_total || 0) / 1000), 0);

    return {
      meta: metaTon,
      realizado: realizadoTon,
      porcentagem: metaTon > 0 ? (realizadoTon / metaTon) * 100 : 0
    };
  };

  const totalMetaMes = clientes.reduce((acc, cli) => acc + calcularProgressoCliente(cli.id).meta, 0);
  const totalRealizadoMes = clientes.reduce((acc, cli) => acc + calcularProgressoCliente(cli.id).realizado, 0);
  const porcentagemGeral = totalMetaMes > 0 ? (totalRealizadoMes / totalMetaMes) * 100 : 0;

  return (
    <div className="p-4 md:p-8 bg-[#E9EEF2] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b-2 border-blue-900 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
            Performance por Cliente {!isAdmin && <Lock size={18} className="text-slate-400" />}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Metas de Tonelagem 2026</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {isAdmin && (
            <Dialog open={isModalAberto} onOpenChange={setIsModalAberto}>
              <DialogTrigger asChild>
                <Button className="bg-[#0A3D73] hover:bg-[#082D54] text-white rounded-none px-6 font-bold text-[10px] uppercase tracking-widest py-6 border-b-2 border-[#051C36]">
                  <PlusCircle size={16} className="mr-2" /> Planejar Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-none p-0">
                <DialogHeader className="p-6 bg-[#0A3D73]">
                  <DialogTitle className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={18} /> Configurar Meta Mensal
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={salvarMeta} className="p-8 space-y-6 text-slate-900">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Cliente</label>
                      <Select onValueChange={(val) => setNovaMeta({...novaMeta, cliente_id: val})}>
                        <SelectTrigger className="w-full rounded-none border-slate-300 focus:ring-0 h-12">
                          <SelectValue placeholder="Selecione o Cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-none border-slate-200">
                          {clientes.map(cli => (
                            <SelectItem key={cli.id} value={cli.id.toString()} className="cursor-pointer">
                              {cli.razao_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Mês</label>
                        <Select defaultValue={selectedMonth} onValueChange={(val) => setNovaMeta({...novaMeta, mes: val})}>
                          <SelectTrigger className="w-full rounded-none border-slate-300 h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white rounded-none border-slate-200">
                            {nomesMeses.map((mes, idx) => (
                              <SelectItem key={mes} value={(idx + 1).toString()}>{mes}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Meta (TON)</label>
                        <Input type="number" step="0.1" className="rounded-none border-slate-300 h-12" onChange={(e) => setNovaMeta({...novaMeta, valor_ton: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-[#0A3D73] rounded-none text-[10px] font-bold uppercase py-6">Gravar Meta</Button>
                    <Button type="button" variant="outline" onClick={() => setIsModalAberto(false)} className="flex-1 rounded-none text-[10px] font-bold uppercase py-6">Cancelar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* SELETOR DE MÊS */}
      <div className="flex gap-1 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {nomesMeses.map((mes, idx) => (
          <button
            key={mes}
            onClick={() => setSelectedMonth((idx + 1).toString())}
            className={`min-w-[80px] py-3 text-[10px] font-black uppercase transition-all border-b-4 ${
              selectedMonth === (idx + 1).toString() 
              ? 'border-[#0A3D73] text-[#0A3D73] bg-white' 
              : 'border-transparent text-slate-400 hover:bg-white/50'
            }`}
          >
            {mes}
          </button>
        ))}
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-[#0A3D73] text-white rounded-none border-none shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Meta Global {nomesMeses[selectedMonth-1]}</span>
            <Target size={20} className="text-blue-300" />
          </div>
          <h2 className="text-3xl font-black">{totalMetaMes.toFixed(1)} <span className="text-sm font-normal">TON</span></h2>
          <div className="mt-4 w-full bg-blue-900/50 h-1">
             <div className="bg-white h-1 transition-all duration-700" style={{ width: `${Math.min(porcentagemGeral, 100)}%` }} />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-none border-none shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realizado no Mês</span>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">{totalRealizadoMes.toFixed(3)} <span className="text-sm font-normal text-slate-400">TON</span></h2>
          <p className="text-[10px] font-bold text-green-600 mt-2 uppercase tracking-tighter">{porcentagemGeral.toFixed(1)}% Atingido</p>
        </Card>

        <Card className="p-6 bg-white rounded-none border-none shadow-md border-l-4 border-blue-400">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clientes Ativos</span>
            <Users size={20} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">{clientes.length} <span className="text-sm font-normal text-slate-400">CLI</span></h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic text-right">Período de {nomesMeses[selectedMonth-1]} 2026</p>
        </Card>
      </div>

      {/* LISTAGEM DE PERFORMANCE */}
      <div className="space-y-3">
        {clientes
          .filter(c => c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(cliente => {
            const status = calcularProgressoCliente(cliente.id);
            return (
              <div key={cliente.id} className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between group hover:border-blue-800 transition-all shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-1/3">
                  <div className={`p-3 ${status.porcentagem >= 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800">{cliente.razao_social}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Meta: {status.meta.toFixed(1)} TON</p>
                  </div>
                </div>

                <div className="w-full md:w-1/3 px-4 py-4 md:py-0">
                  <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                    <span className="text-slate-400">Progresso de Compra</span>
                    <span className={status.porcentagem >= 100 ? "text-green-600" : "text-blue-900"}>{status.porcentagem.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${status.porcentagem >= 100 ? 'bg-green-500' : 'bg-[#0A3D73]'}`} 
                      style={{ width: `${Math.min(status.porcentagem, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-1/3">
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Faturado</p>
                    <p className="text-sm font-black text-slate-700">{status.realizado.toFixed(3)} TON</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-blue-900">
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Metas;