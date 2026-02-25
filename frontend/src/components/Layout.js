import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  DollarSign, 
  Target, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Pegamos 'isAdmin' para controlar a visibilidade do menu
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Definimos quais rotas são exclusivas para Administradores
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
    { path: '/clientes', icon: Users, label: 'Clientes', adminOnly: false },
    { path: '/materiais', icon: Package, label: 'Materiais', adminOnly: false },
    { path: '/pedidos', icon: FileText, label: 'Pedidos', adminOnly: false },
    { path: '/comissoes', icon: DollarSign, label: 'Comissões', adminOnly: false },
    // Itens restritos
    { path: '/notas-fiscais', icon: Receipt, label: 'Notas Fiscais', adminOnly: true },
    { path: '/metas', icon: Target, label: 'Metas', adminOnly: true },
  ];

  // Filtra os itens: se não for admin, remove os itens marcados como 'adminOnly'
  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavButton = ({ item, isMobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <button
        key={item.path}
        onClick={() => {
          navigate(item.path);
          if (isMobile) setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
          isActive 
            ? 'bg-slate-800 text-white shadow-sm' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={18} strokeWidth={1.5} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Karla, sans-serif' }}>
            ERP Sistema
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">Gestão de Vendas</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredMenuItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="mb-3 px-2">
            <p className="text-sm font-bold text-white truncate">{user?.nome || 'Usuário'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black">{isAdmin ? 'Administrador' : 'Consultor'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300 shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">ERP Sistema</h1>
                <p className="text-xs text-slate-500">Gestão de Vendas</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {filteredMenuItems.map((item) => (
                <NavButton key={item.path} item={item} isMobile={true} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior */}
        <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center shadow-sm">
          <div className="flex items-center justify-between w-full">
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} className="text-slate-700" />
            </button>
            
            <div className="hidden md:block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Painel de Controle Interno
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-slate-700">{user?.nome}</span>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black uppercase">
                  {isAdmin ? 'Admin' : 'Vendedor'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#0A3D73] flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                {user?.nome?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F1F5F9]">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;