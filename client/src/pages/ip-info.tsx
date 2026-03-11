import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  MapPin,
  Building,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Wifi,
  Shield,
  Languages,
  MonitorSmartphone,
  Network,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IpData {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  timezone?: string;
  loc?: string;
  asn?: string;
  postal?: string;
  country_code?: string;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  touchPoints: number;
  connectionType: string;
  downlink: string;
  effectiveType: string;
  hardwareConcurrency: number;
  deviceMemory: string;
  online: boolean;
}

function getDeviceInfo(): DeviceInfo {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  return {
    userAgent: nav.userAgent,
    platform: nav.platform || "Unknown",
    language: nav.language,
    languages: Array.from(nav.languages || [nav.language]),
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack === "1",
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    touchPoints: nav.maxTouchPoints || 0,
    connectionType: conn?.type || "Not available",
    downlink: conn?.downlink ? `${conn.downlink} Mbps` : "Not available",
    effectiveType: conn?.effectiveType || "Not available",
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : "Not available",
    online: nav.onLine,
  };
}

function detectBrowser(ua: string): string {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "Unknown";
}

function detectOS(ua: string): string {
  if (ua.includes("Windows NT 10")) return "Windows 10/11";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}

export default function IpInfo() {
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchIpInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ip-info");
      const data = await res.json();
      setIpData(data);
    } catch {
      toast({ title: "Failed to fetch IP info", variant: "destructive" });
    }
    setLoading(false);
  };

  const detectLocalIp = () => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) return;
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.(\d{1,3}\.){2}\d{1,3})/);
        if (ipMatch) {
          setLocalIp(ipMatch[1]);
          pc.close();
        }
      };
      setTimeout(() => pc.close(), 3000);
    } catch {
      setLocalIp("Not available");
    }
  };

  useEffect(() => {
    fetchIpInfo();
    detectLocalIp();
    setDeviceInfo(getDeviceInfo());
  }, []);

  const copyIp = () => {
    if (ipData?.ip) {
      navigator.clipboard.writeText(ipData.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "IP copied to clipboard" });
    }
  };

  const networkItems = ipData
    ? [
        { icon: MapPin, label: "Location", value: [ipData.city, ipData.region, ipData.country].filter(Boolean).join(", ") || "Not available" },
        { icon: Building, label: "ISP / Organization", value: ipData.org || "Not available" },
        { icon: Clock, label: "Timezone", value: ipData.timezone || "Not available" },
        { icon: Globe, label: "Coordinates", value: ipData.loc || "Not available" },
        { icon: Network, label: "Local IP", value: localIp || "Detecting..." },
        ...(ipData.postal ? [{ icon: MapPin, label: "Postal Code", value: ipData.postal }] : []),
        ...(ipData.country_code ? [{ icon: Globe, label: "Country Code", value: ipData.country_code }] : []),
      ]
    : [];

  const browser = deviceInfo ? detectBrowser(deviceInfo.userAgent) : "";
  const os = deviceInfo ? detectOS(deviceInfo.userAgent) : "";

  return (
    <div className="p-4 space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">Public IP Address</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={fetchIpInfo}
              data-testid="button-refresh-ip"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-48 bg-white/20" />
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold font-mono tracking-wider" data-testid="text-public-ip">
                {ipData?.ip || "N/A"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={copyIp}
                data-testid="button-copy-ip"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-0 divide-y divide-border">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-16 mb-1.5" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))
            : networkItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium truncate" data-testid={`text-${item.label.toLowerCase().replace(/[\s/]/g, "-")}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </Card>

      {deviceInfo && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MonitorSmartphone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Device & Browser</h3>
            <Badge variant="secondary" className="text-xs ml-auto">Offline</Badge>
          </div>
          <div className="space-y-0 divide-y divide-border">
            {[
              { icon: Monitor, label: "Browser", value: browser },
              { icon: Smartphone, label: "Operating System", value: os },
              { icon: MonitorSmartphone, label: "Screen", value: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight} @${deviceInfo.pixelRatio}x` },
              { icon: Languages, label: "Language", value: deviceInfo.languages.join(", ") },
              { icon: Wifi, label: "Connection", value: deviceInfo.effectiveType !== "Not available" ? `${deviceInfo.effectiveType.toUpperCase()} (${deviceInfo.downlink})` : deviceInfo.online ? "Online" : "Offline" },
              { icon: Shield, label: "Do Not Track", value: deviceInfo.doNotTrack ? "Enabled" : "Disabled" },
              { icon: Monitor, label: "Touch Support", value: deviceInfo.touchPoints > 0 ? `Yes (${deviceInfo.touchPoints} points)` : "No" },
              { icon: Monitor, label: "CPU Cores", value: deviceInfo.hardwareConcurrency > 0 ? `${deviceInfo.hardwareConcurrency}` : "Not available" },
              ...(deviceInfo.deviceMemory !== "Not available" ? [{ icon: Monitor, label: "Device Memory", value: deviceInfo.deviceMemory }] : []),
              { icon: Monitor, label: "Color Depth", value: `${deviceInfo.colorDepth}-bit` },
              { icon: Shield, label: "Cookies", value: deviceInfo.cookiesEnabled ? "Enabled" : "Disabled" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-medium truncate" data-testid={`text-device-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="text-xs font-semibold mb-2">How it works</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Public IP and location data is fetched from ipapi.co API. Local IP detection uses WebRTC
          (works offline). Device information is read from browser APIs - all locally, nothing
          is sent to any server. Connection info uses the Network Information API where available.
          Some fields may show "Not available" depending on your browser's support.
        </p>
      </Card>
    </div>
  );
}
