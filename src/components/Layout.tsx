import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Landmark, LayoutDashboard, TrendingUp, Search, Bell, Settings, UserCircle, LogOut, Menu, ChevronDown } from "lucide-react";

export function Layout() {
  const location = useLocation();
  const investmentsOpen = location.pathname.startsWith("/investments");
  const banksOpen = location.pathname.startsWith("/banks");
  const [investExpanded, setInvestExpanded] = useState(investmentsOpen);
  const [banksExpanded, setBanksExpanded] = useState(banksOpen);

  const topNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const investSubItems = [
    { href: "/investments/portfolio", label: "Patrimônio" },
    { href: "/investments/transactions", label: "Lançamentos" },
    { href: "/investments/institution-aliases", label: "Resumo Instituição" },
  ];

  const bankSubItems = [
    { href: "/banks/accounts", label: "Contas" },
    { href: "/banks/transactions", label: "Transações" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar (Dark) */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col hidden md:flex">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 font-bold text-lg text-white">
            <Landmark className="h-6 w-6 text-blue-500" />
            <span>Carteira<span className="text-blue-500">App</span></span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto w-full">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4">Menu Principal</div>

          {/* Itens simples */}
          {topNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Banks submenu */}
          <div>
            <button
              onClick={() => setBanksExpanded((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                banksOpen
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Landmark className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">Contas Bancárias</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform ${banksExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {banksExpanded && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                {bankSubItems.map((sub) => {
                  const isActive = location.pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        isActive
                          ? "bg-blue-500/20 text-blue-300 font-medium"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
                {/* Nested quick links under Transações */}
                <div className="mt-1 ml-2 pl-2 space-y-1">
                  <Link
                    to="/banks/transactions/import"
                    className="text-sm text-slate-400 hover:text-slate-100 block px-3 py-1"
                  >
                    Importação
                  </Link>
                  <Link
                    to="/banks/transactions/new"
                    className="text-sm text-slate-400 hover:text-slate-100 block px-3 py-1"
                  >
                    Nova transação
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Investimentos (com submenu) */}
          <div>
            <button
              onClick={() => setInvestExpanded((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                investmentsOpen
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <TrendingUp className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">Investimentos</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform ${investExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {investExpanded && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                {investSubItems.map((sub) => {
                  const isActive = location.pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        isActive
                          ? "bg-blue-500/20 text-blue-300 font-medium"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar (Light) */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            {/* Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="h-9 w-64 rounded-md border border-slate-200 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="text-slate-500 hover:text-slate-700 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="h-8 border-l border-slate-200 mx-2"></div>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              <UserCircle className="h-8 w-8 text-slate-400" />
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="font-semibold">Administrador</span>
                <span className="text-[10px] text-slate-500 font-normal">Função: Admin</span>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content bg-slate-50 */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
