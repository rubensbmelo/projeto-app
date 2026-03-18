import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) { toast.success('Acesso autorizado'); navigate('/'); }
      else { toast.error(result.error || 'Credenciais inválidas'); }
    } catch { toast.error('O servidor não respondeu. Verifique sua conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#E9EEF2]">

      {/* ── COLUNA ESQUERDA ── */}
      <div
        className="hidden lg:flex lg:w-[60%] bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=2070)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D73]/95 via-[#0A3D73]/80 to-blue-900/40" />
        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <img src="/logo-repflow.png" alt="RepFlow" className="h-24 w-auto mb-8 brightness-0 invert" />
          <p className="text-blue-300 font-black text-[11px] uppercase tracking-[0.3em] mb-6">
            Gestão de Representação Comercial
          </p>
          <p className="text-lg text-blue-100 max-w-md leading-relaxed font-light italic">
            Sincronização em tempo real de pedidos, metas e performance financeira.
          </p>
          <div className="mt-16 flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck size={18} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Acesso Restrito & Criptografado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COLUNA DIREITA ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 bg-[#E9EEF2] lg:bg-white">
        <div className="w-full max-w-sm space-y-10">

          {/* Logo mobile */}
          <div className="flex justify-center lg:hidden">
            <img src="/logo-repflow.png" alt="RepFlow" className="h-12 w-auto" />
          </div>

          {/* Header */}
          <div className="space-y-2">
            {/* Logo no lugar do badge */}
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-repflow.png" alt="RepFlow" className="h-12 w-auto" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              Acesso ao Sistema
            </h2>
            <div className="h-1.5 w-12 bg-[#0A3D73]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-[#0A3D73] tracking-widest">Identidade (E-mail)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input id="email" type="email" placeholder="usuario@empresa.com.br"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required
                  className="rounded-none pl-10 h-12 border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase text-[#0A3D73] tracking-widest">Chave de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input id="password" type="password" placeholder="••••••••"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
                  className="rounded-none pl-10 h-12 border-slate-300 focus:border-[#0A3D73] focus:ring-1 focus:ring-[#0A3D73]" />
              </div>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-14 bg-[#0A3D73] hover:bg-[#082D54] text-white font-black text-xs uppercase tracking-[0.3em] rounded-none shadow-xl border-b-4 border-blue-900 active:border-b-0">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Autenticar no Sistema'}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Acesso exclusivo para consultores autorizados.<br/>
              Solicite suas credenciais à administração.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;