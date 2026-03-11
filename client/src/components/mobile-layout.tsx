import { useLocation, Link } from "wouter";
import {
  Gauge,
  Globe,
  Search,
  Radio,
  QrCode,
  History,
  LayoutDashboard,
  Menu,
  X,
  Moon,
  Sun,
  Shield,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/speed-test", label: "Speed Test", icon: Gauge },
  { path: "/ip-info", label: "IP Info", icon: Globe },
  { path: "/ping", label: "Ping", icon: Radio },
  { path: "/dns", label: "DNS Lookup", icon: Search },
  { path: "/whois", label: "WHOIS", icon: Globe },
  { path: "/ssl-check", label: "SSL Check", icon: Lock },
  { path: "/webrtc", label: "WebRTC Leak", icon: Shield },
  { path: "/qr-generator", label: "WiFi QR", icon: QrCode },
  { path: "/history", label: "History", icon: History },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentPage = navItems.find((item) => item.path === location);
  const bottomNavItems = navItems.slice(0, 5);

  return (
    <div className="flex h-[100dvh] bg-background" data-testid="app-layout">
      {!isMobile && (
        <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <img src="/logo.png" alt="NetScope" className="w-9 h-9" />
            <div>
              <h1 className="text-sm font-bold leading-tight">NetScope</h1>
              <p className="text-[10px] text-muted-foreground">Smart Network Toolkit</p>
            </div>
          </div>
          <ScrollArea className="flex-1 py-2">
            <nav className="px-2 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <button
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      data-testid={`sidebar-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="px-3 py-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-2 text-muted-foreground"
              data-testid="button-toggle-theme-sidebar"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
          <div className="px-4 py-2 border-t border-border text-center">
            <p className="text-[9px] text-muted-foreground">Powered by</p>
            <p className="text-[10px] font-semibold text-muted-foreground">Sudais Tech</p>
          </div>
        </aside>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {isMobile && (
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="NetScope" className="w-8 h-8" />
              <div>
                <h1 className="text-sm font-semibold leading-tight" data-testid="text-page-title">
                  {currentPage?.label || "NetScope"}
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight">NetScope</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-8 w-8"
                data-testid="button-menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </header>
        )}

        {isMobile && menuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute right-0 top-[53px] w-64 bg-card border-l border-border h-[calc(100dvh-53px)] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ScrollArea className="h-full">
                <nav className="p-3 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <button
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-foreground hover:bg-accent"
                          }`}
                          data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      </Link>
                    );
                  })}
                </nav>
                <div className="px-3 py-3 border-t border-border mt-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Powered by</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Sudais Tech</p>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto ${isMobile ? "pb-16" : ""}`}>
          <div className="max-w-2xl mx-auto">{children}</div>
        </main>

        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-30" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <button
                      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[56px] ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`tab-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                      <span className={`text-[10px] leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                      )}
                    </button>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
