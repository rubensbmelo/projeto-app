import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, LayoutDashboard } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await register(formData.nome, formData.email, formData.password);
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        toast.success(isRegister ? 'Cadastro realizado!' : 'Bem-vindo de volta!');
        navigate('/');
      } else {
        toast.error(result.error || 'Erro na autenticação');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Coluna da Esquerda - Identidade Visual */}
      <div 
        className="hidden lg:flex lg:w-[55%] bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1543817625-95f25b299975?q=80&w=2070)'
        }}
      >
        {/* Overlay Gradiente Profissional */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-indigo-900/60" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="bg-indigo-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
            <LayoutDashboard size={28} />
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight leading-tight">
            Gestão Inteligente <br /> para Representantes
          </h1>
          <p className="text-xl text-slate-300 max-w-md leading-relaxed">
            Controle total sobre seus materiais, pedidos e comissões em uma única plataforma.
          </p>
          
          <div className="mt-12 flex items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">
                  USR
                </div>
              ))}
            </div>
            <span>Junte-se a centenas de representantes ativos</span>
          </div>
        </div>
      </div>

      {/* Coluna da Direita - Formulário */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-left lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isRegister ? 'Criar sua conta' : 'Acessar o sistema'}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {isRegister ? 'Comece a organizar suas vendas hoje.' : 'Entre com suas credenciais para continuar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-bold uppercase text-slate-500 ml-1">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    id="nome"
                    placeholder="Como deseja ser chamado?"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required={isRegister}
                    className="pl-10 h-12 bg-white border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500 ml-1">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10 h-12 bg-white border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Senha</Label>
                {!isRegister && (
                  <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pl-10 h-12 bg-white border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                </span>
              ) : (
                isRegister ? 'Finalizar Cadastro' : 'Entrar na Conta'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {isRegister ? (
                <span>Já possui uma conta? <strong className="text-indigo-600 underline underline-offset-4">Fazer login</strong></span>
              ) : (
                <span>Ainda não tem acesso? <strong className="text-indigo-600 underline underline-offset-4">Cadastre-se</strong></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;