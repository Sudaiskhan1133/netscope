import { Link } from "wouter";
import {
  Gauge,
  Globe,
  Radio,
  Search,
  Shield,
  QrCode,
  History,
  Wifi,
  WifiOff,
  ArrowRight,
  Activity,
  Clock,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSpeedHistory, getPingHistory } from "@/lib/local-storage";
import { useEffect, useState } from "react";

const tools = [
  {
    path: "/speed-test",
    label: "Speed Test",
    icon: Gauge,
    description: "Test download & upload speed",
    iconBg: "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
    needsOnline: true,
  },
  {
    path: "/ip-info",
    label: "IP Info",
    icon: Globe,
    description: "Your IP, location & device",
    iconBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
    needsOnline: false,
  },
  {
    path: "/ping",
    label: "Ping Tool",
    icon: Radio,
    description: "Test host connectivity",
    iconBg: "bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400",
    needsOnline: true,
  },
  {
    path: "/dns",
    label: "DNS Lookup",
    icon: Search,
    description: "Query DNS records",
    iconBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
    needsOnline: true,
  },
  {
    path: "/whois",
    label: "WHOIS",
    icon: Globe,
    description: "Domain registration info",
    iconBg: "bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400",
    needsOnline: true,
  },
  {
    path: "/ssl-check",
    label: "SSL Check",
    icon: Lock,
    description: "Verify SSL certificates",
    iconBg: "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-400",
    needsOnline: true,
  },
  {
    path: "/webrtc",
    label: "WebRTC Leak",
    icon: Shield,
    description: "Check for IP leaks",
    iconBg: "bg-red-500/10 text-red-500 dark:bg-red-400/10 dark:text-red-400",
    needsOnline: false,
  },
  {
    path: "/qr-generator",
    label: "WiFi QR",
    icon: QrCode,
    description: "Share WiFi via QR code",
    iconBg: "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400",
    needsOnline: false,
  },
  {
    path: "/history",
    label: "History",
    icon: History,
    description: "Past test results",
    iconBg: "bg-gray-500/10 text-gray-500 dark:bg-gray-400/10 dark:text-gray-400",
    needsOnline: false,
  },
];

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSpeed, setLastSpeed] = useState<{ download: number; upload: number; ping: number } | null>(null);
  const [totalTests, setTotalTests] = useState(0);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const history = getSpeedHistory();
    setTotalTests(history.length);
    if (history.length > 0) {
      setLastSpeed({
        download: history[0].download,
        upload: history[0].upload,
        ping: history[0].ping,
      });
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="p-4 space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <span className="text-sm font-medium" data-testid="text-connection-status">
              {isOnline ? "Connected" : "Offline"}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs ${
              isOnline
                ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                : "bg-red-500/20 text-white border-red-300/30"
            }`}
            data-testid="badge-status"
          >
            {isOnline ? "Online" : "No Network"}
          </Badge>
        </div>

        {lastSpeed ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid="text-last-download">
                {lastSpeed.download.toFixed(1)}
              </p>
              <p className="text-xs opacity-80">Mbps Down</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid="text-last-upload">
                {lastSpeed.upload.toFixed(1)}
              </p>
              <p className="text-xs opacity-80">Mbps Up</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid="text-last-ping">
                {lastSpeed.ping.toFixed(0)}
              </p>
              <p className="text-xs opacity-80">ms Ping</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm opacity-80">No speed tests yet</p>
            <Link href="/speed-test">
              <button className="mt-2 text-xs font-medium underline underline-offset-2 opacity-90 hover:opacity-100" data-testid="link-run-first-test">
                Run your first test
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight" data-testid="text-total-tests">{totalTests}</p>
            <p className="text-[11px] text-muted-foreground">Tests Run</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight" data-testid="text-ping-count">{getPingHistory().length}</p>
            <p className="text-[11px] text-muted-foreground">Pings Sent</p>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Network Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const disabled = tool.needsOnline && !isOnline;
            return (
              <Link key={tool.path} href={disabled ? "#" : tool.path}>
                <Card
                  className={`p-4 transition-all cursor-pointer group active:scale-[0.98] relative ${
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/30"
                  }`}
                  data-testid={`card-tool-${tool.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {!tool.needsOnline && (
                    <Badge variant="outline" className="absolute top-2 right-2 text-[8px] px-1 py-0 h-4 text-emerald-500 border-emerald-500/30">
                      Offline
                    </Badge>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-sm font-semibold mb-0.5">{tool.label}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">{tool.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
