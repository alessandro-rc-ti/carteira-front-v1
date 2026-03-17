import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import useI18nStore from "@/stores/i18nStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Landmark,
  LayoutDashboard,
  TrendingUp,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  ChevronDown,
  Wallet,
  Activity,
  Sun,
  Moon,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ── nav items ────────────────────────────────────────────────────────────────

const topNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: ["dashboard.main.view"] },
];

const bankSubItems = [
  { href: "/banks/dashboard", label: "Dashboard da Conta", icon: LayoutDashboard, permissions: ["bank.dashboard.view"] },
  { href: "/banks/accounts", label: "Contas", icon: Wallet, permissions: ["bank.accounts.view", "bank.accounts.manage"] },
  { href: "/banks/transactions", label: "Transações", icon: Activity, permissions: ["transaction.view"] },
];

const investSubItems = [
  { href: "/investments/portfolio", label: "Patrimônio", icon: TrendingUp, permissions: ["investment.portfolio.view"] },
  { href: "/investments/transactions", label: "Lançamentos", icon: Activity, permissions: ["investment.transactions.view", "investment.transactions.manage"] },
  { href: "/investments/institution-aliases", label: "Inst. Aliases", icon: Landmark, permissions: ["institution_alias.manage"] },
];

const adminSubItems = [
  { href: "/users", label: "Usuários", icon: Users, permissions: ["user.manage"] },
];

// ── sidebar nav content (reusable in Sheet + aside) ──────────────────────────

function SidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const location = useLocation();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const banksOpen = location.pathname.startsWith("/banks");
  const investmentsOpen = location.pathname.startsWith("/investments");
  const adminOpen = location.pathname.startsWith("/users");
  const [banksExpanded, setBanksExpanded] = useState(banksOpen);
  const [investExpanded, setInvestExpanded] = useState(investmentsOpen);
  const [adminExpanded, setAdminExpanded] = useState(adminOpen);
  const visibleTopNavItems = topNavItems.filter((item) => hasPermission(item.permissions));
  const visibleBankSubItems = bankSubItems.filter((item) => hasPermission(item.permissions));
  const visibleInvestSubItems = investSubItems.filter((item) => hasPermission(item.permissions));
  const visibleAdminSubItems = adminSubItems.filter((item) => hasPermission(item.permissions));

  const NavLink = ({
    href,
    icon: Icon,
    label,
    exact = false,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    exact?: boolean;
  }) => {
    const isActive = exact ? location.pathname === href : location.pathname.startsWith(href);
    return (
      <Link
        to={href}
        onClick={onCloseMobile}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
          isActive
            ? "bg-blue-600 text-white font-medium"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {label}
      </Link>
    );
  };

  const SubLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
  }) => {
    const isActive = location.pathname === href;
    return (
      <Link
        to={href}
        onClick={onCloseMobile}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
          isActive
            ? "bg-blue-500/20 text-blue-300 font-medium"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 mt-2">
          Menu Principal
        </p>

        {visibleTopNavItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}

        {/* ── Contas Bancárias ── */}
        {visibleBankSubItems.length > 0 && <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-3">
            Contas Bancárias
          </p>
          <button
            onClick={() => setBanksExpanded((v) => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
              banksOpen
                ? "text-slate-100 bg-slate-800"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <Landmark className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left font-medium">Contas Bancárias</span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                banksExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {banksExpanded && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
              {visibleBankSubItems.map((sub) => (
                <SubLink key={sub.href} href={sub.href} icon={sub.icon} label={sub.label} />
              ))}
            </div>
          )}
        </div>}

        {/* ── Investimentos ── */}
        {visibleInvestSubItems.length > 0 && <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-3">
            Investimentos
          </p>
          <button
            onClick={() => setInvestExpanded((v) => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
              investmentsOpen
                ? "text-slate-100 bg-slate-800"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <TrendingUp className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left font-medium">Investimentos</span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                investExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {investExpanded && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
              {visibleInvestSubItems.map((sub) => (
                <SubLink key={sub.href} href={sub.href} icon={sub.icon} label={sub.label} />
              ))}
            </div>
          )}
        </div>}

        {visibleAdminSubItems.length > 0 && <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-3">
            Administração
          </p>
          <button
            onClick={() => setAdminExpanded((v) => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
              adminOpen
                ? "text-slate-100 bg-slate-800"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left font-medium">Administração</span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                adminExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {adminExpanded && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
              {visibleAdminSubItems.map((sub) => (
                <SubLink key={sub.href} href={sub.href} icon={sub.icon} label={sub.label} />
              ))}
            </div>
          )}
        </div>}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-md hover:bg-slate-800 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────

export function Layout() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const t = useI18nStore((s) => s.t);
  const user = useAuthStore((state) => state.user);

  const roleLabel = {
    OWNER: "Owner",
    ADMIN: "Admin",
    STANDARD: "Padrão",
  }[user?.role ?? "STANDARD"];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 text-slate-100 flex-col hidden md:flex">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-base text-white">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-white" />
            </div>
            <span>
              Carteira<span className="text-blue-400">App</span>
            </span>
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar (Sheet) ── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-slate-900 text-slate-100 border-slate-800 flex flex-col"
        >
          <SheetHeader className="h-14 flex-row items-center justify-between px-5 border-b border-slate-800 space-y-0">
            <SheetTitle className="text-base font-bold text-white">
              Carteira<span className="text-blue-400">App</span>
            </SheetTitle>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>
          <SidebarContent onCloseMobile={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main container ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </Button>

            <div className="h-6 border-l border-border mx-1" />

            <button className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity">
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <span className="hidden md:inline text-sm font-medium">{user?.username ?? t("layout.user.admin", "Admin")}</span>
              <span className="hidden lg:inline text-xs uppercase tracking-[0.2em] text-muted-foreground">{roleLabel}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
