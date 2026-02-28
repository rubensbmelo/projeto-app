import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Package, FileText,
  Receipt, DollarSign, Target, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { path: '/',              icon: LayoutDashboard, label: 'Dashboard',     adminOnly: false, group: 'main' },
    { path: '/clientes',      icon: Users,           label: 'Clientes',      adminOnly: false, group: 'main' },
    { path: '/materiais',     icon: Package,         label: 'Materiais',     adminOnly: false, group: 'main' },
    { path: '/pedidos',       icon: FileText,        label: 'Pedidos',       adminOnly: false, group: 'main' },
    { path: '/comissoes',     icon: DollarSign,      label: 'Comissões',     adminOnly: false, group: 'main' },
    { path: '/notas-fiscais', icon: Receipt,         label: 'Notas Fiscais', adminOnly: true,  group: 'admin' },
    { path: '/metas',         icon: Target,          label: 'Metas',         adminOnly: true,  group: 'admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);
  const mainItems  = filteredMenuItems.filter(i => i.group === 'main');
  const adminItems = filteredMenuItems.filter(i => i.group === 'admin');

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavItem = ({ item, isMobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <button
        onClick={() => { navigate(item.path); if (isMobile) setSidebarOpen(false); }}
        className={`
          group w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider
          transition-all duration-150 relative overflow-hidden
          ${isActive
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200'
          }
        `}
      >
        {/* Barra ativa esquerda */}
        <span className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-150 ${isActive ? 'bg-[#4A90D9]' : 'bg-transparent group-hover:bg-slate-600'}`} />

        {/* Background ativo */}
        {isActive && (
          <span className="absolute inset-0 bg-gradient-to-r from-[#0A3D73]/80 to-[#0A3D73]/30" />
        )}

        {/* Ícone */}
        <span className={`relative z-10 shrink-0 transition-all duration-150 ${isActive ? 'text-[#4A90D9]' : 'text-slate-500 group-hover:text-slate-300'}`}>
          <Icon size={13} strokeWidth={2.5} />
        </span>

        {/* Label */}
        <span className="relative z-10 flex-1 text-left">{item.label}</span>

        {/* Chevron no item ativo */}
        {isActive && (
          <ChevronRight size={10} className="relative z-10 text-[#4A90D9] shrink-0" />
        )}
      </button>
    );
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">

      {/* ── LOGO ── */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        {/* Bloco de marca */}
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-6 h-6 bg-[#0A3D73] border border-[#4A90D9]/40 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-[#4A90D9]">E</span>
          </div>
          <div>
            <p className="text-[12px] font-black text-white uppercase tracking-widest leading-none">ERP Sistema</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Gestão de Vendas</p>
          </div>
        </div>
      </div>

      {/* ── NAV PRINCIPAL ── */}
      <nav className="flex-1 pt-3 pb-2 overflow-y-auto">

        {/* Label de seção */}
        <p className="px-4 mb-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-slate-600">
          Módulos
        </p>

        <div className="space-y-0.5 px-1">
          {mainItems.map(item => (
            <NavItem key={item.path} item={item} isMobile={isMobile} />
          ))}
        </div>

        {/* Seção Admin */}
        {adminItems.length > 0 && (
          <>
            <div className="mx-4 my-3 border-t border-white/5" />
            <p className="px-4 mb-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-slate-600">
              Administrativo
            </p>
            <div className="space-y-0.5 px-1">
              {adminItems.map(item => (
                <NavItem key={item.path} item={item} isMobile={isMobile} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* ── FOOTER USUÁRIO ── */}
      <div className="border-t border-white/5 p-3">
        {/* Card do usuário */}
        <div className="flex items-center gap-2 px-2 py-2 mb-2 bg-white/3">
          <div className="w-6 h-6 rounded-none bg-[#0A3D73] border border-[#4A90D9]/30 flex items-center justify-center text-[10px] font-black text-white shrink-0">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white truncate leading-none">{user?.nome || 'Usuário'}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5 text-[#4A90D9]">
              {isAdmin ? 'Administrador' : 'Consultor'}
            </p>
          </div>
        </div>

        {/* Botão sair */}
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={11} strokeWidth={2.5} className="shrink-0 group-hover:text-red-400 transition-colors" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#E9EEF2' }}>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside
        className="hidden md:flex md:flex-col w-48 shrink-0 border-r border-white/5"
        style={{
          background: 'linear-gradient(180deg, #0d1117 0%, #111827 60%, #0f172a 100%)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── SIDEBAR MOBILE ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-48 flex flex-col shadow-2xl border-r border-white/5"
            style={{ background: 'linear-gradient(180deg, #0d1117 0%, #111827 60%, #0f172a 100%)' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <p className="text-[11px] font-black text-white uppercase tracking-widest">ERP Sistema</p>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X size={14} className="text-slate-400" />
              </button>
            </div>
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-4 h-11 flex items-center shadow-sm">
          <div className="flex items-center justify-between w-full">

            {/* Menu mobile */}
            <button
              className="md:hidden p-1.5 hover:bg-slate-100 rounded transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-slate-700" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Painel de Controle Interno
              </span>
            </div>

            {/* Usuário */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[11px] font-bold text-slate-700 leading-none">{user?.nome}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-[#0A3D73] mt-0.5">
                  {isAdmin ? 'Admin' : 'Vendedor'}
                </span>
              </div>
              <div className="w-7 h-7 bg-[#0A3D73] flex items-center justify-center text-white text-[10px] font-black border border-[#0A3D73]/30 shadow-sm">
                {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto bg-[#E9EEF2]">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;