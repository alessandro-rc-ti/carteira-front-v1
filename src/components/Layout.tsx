import { Outlet, Link, useLocation } from "react-router-dom";
import { Landmark } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [{ href: "/banks", label: "Bancos", icon: Landmark }];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Landmark className="h-5 w-5" />
            <span>Carteira</span>
          </Link>
          <nav className="ml-8 flex items-center gap-6 text-sm">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`transition-colors hover:text-foreground ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
