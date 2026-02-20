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
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/materiais', icon: Package, label: 'Materiais' },
    { path: '/pedidos', icon: FileText, label: 'Pedidos' },
    { path: '/notas-fiscais', icon: Receipt, label: 'Notas Fiscais' },
    { path: '/comissoes', icon: DollarSign, label: 'Comissões' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 text-slate-300">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Karla, sans-serif' }}>
            ERP Sistema
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gestão de Vendas</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => navigate(item.path)}
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
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white">{user?.nome}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Karla, sans-serif' }}>
                  ERP Sistema
                </h1>
                <p className="text-xs text-slate-400 mt-1">Gestão de Vendas</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
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
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} className="text-slate-700" />
            </button>
            <div className="hidden md:block" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.nome}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;