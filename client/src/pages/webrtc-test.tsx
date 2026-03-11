import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, Play, Loader2, Globe, Wifi } from "lucide-react";

interface LeakResult {
  ips: string[];
  hasLeak: boolean;
  localIps: string[];
  publicIps: string[];
}

export default function WebRTCTest() {
  const [result, setResult] = useState<LeakResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = useCallback(async () => {
    setTesting(true);
    setResult(null);

    const ips = new Set<string>();

    try {
      const servers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];

      const pc = new RTCPeerConnection({ iceServers: servers });
      pc.createDataChannel("");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve();
        }, 5000);

        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            clearTimeout(timeout);
            pc.close();
            resolve();
            return;
          }
          const candidate = event.candidate.candidate;
          const ipv4 = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          const ipv6 = candidate.match(/([0-9a-f]{1,4}(:[0-9a-f]{1,4}){7})/i);
          if (ipv4) ips.add(ipv4[1]);
          if (ipv6) ips.add(ipv6[1]);
        };
      });
    } catch {
      // WebRTC not available
    }

    const allIps = Array.from(ips);

    function isPrivateIp(ip: string): boolean {
      if (ip.includes(":")) return false;
      const parts = ip.split(".").map(Number);
      if (parts.length !== 4) return false;
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 127) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
      return false;
    }

    const localIps = allIps.filter((ip) => !ip.includes(":") && isPrivateIp(ip));
    const publicIps = allIps.filter((ip) => !ip.includes(":") && !isPrivateIp(ip));

    setResult({
      ips: allIps,
      hasLeak: publicIps.length > 0,
      localIps,
      publicIps,
    });
    setTesting(false);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card className="overflow-hidden">
        <div
          className={`p-6 text-white ${
            result
              ? result.hasLeak
                ? "bg-gradient-to-br from-red-500 to-rose-600"
                : "bg-gradient-to-br from-emerald-500 to-green-600"
              : "bg-gradient-to-br from-slate-600 to-slate-700"
          }`}
        >
          <div className="text-center">
            {!result && !testing && (
              <>
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold mb-2">WebRTC Leak Test</h2>
                <p className="text-sm opacity-80 mb-6">
                  Check if your real IP address is exposed through WebRTC
                </p>
              </>
            )}
            {testing && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin opacity-80" />
                <h2 className="text-xl font-bold mb-2">Testing...</h2>
                <p className="text-sm opacity-80 mb-6">Checking for WebRTC leaks</p>
              </>
            )}
            {result && !result.hasLeak && (
              <>
                <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No Leaks Detected</h2>
                <p className="text-sm opacity-80 mb-6">
                  Your public IP is not exposed via WebRTC
                </p>
              </>
            )}
            {result && result.hasLeak && (
              <>
                <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Leak Detected!</h2>
                <p className="text-sm opacity-80 mb-6">
                  Your real IP may be visible through WebRTC
                </p>
              </>
            )}

            <Button
              onClick={runTest}
              disabled={testing}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6"
              data-testid="button-run-webrtc-test"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {result ? "Test Again" : "Run Test"}
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <>
          {result.localIps.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Local IPs Found</h3>
                <Badge variant="secondary" className="text-xs ml-auto">{result.localIps.length}</Badge>
              </div>
              <div className="space-y-2">
                {result.localIps.map((ip) => (
                  <div key={ip} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm font-mono" data-testid={`text-local-ip-${ip}`}>{ip}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">Local</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.publicIps.length > 0 && (
            <Card className="p-4 border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-500">Public IPs Exposed</h3>
                <Badge variant="destructive" className="text-xs ml-auto">{result.publicIps.length}</Badge>
              </div>
              <div className="space-y-2">
                {result.publicIps.map((ip) => (
                  <div key={ip} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-mono" data-testid={`text-public-ip-${ip}`}>{ip}</span>
                    <Badge variant="destructive" className="text-[10px] ml-auto">Leaked</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.ips.length === 0 && (
            <Card className="p-6 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium">No IPs discovered</p>
              <p className="text-xs text-muted-foreground mt-1">
                WebRTC may be disabled in your browser
              </p>
            </Card>
          )}
        </>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">Works Offline</Badge>
          <Badge variant="outline" className="text-xs">No API Used</Badge>
        </div>
        <h4 className="text-xs font-semibold mb-1.5">How it works</h4>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          This test runs 100% in your browser using WebRTC (Web Real-Time Communication) APIs.
          It creates a peer connection and uses Google's STUN servers to discover all IP addresses
          your browser can see.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          If you're using a VPN, only the VPN's IP should appear. If your real public IP shows up
          alongside the VPN IP, that's a "leak" - websites could discover your real location.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No data is sent to our servers. The STUN servers only help discover IPs but don't
          store any information. Local/private IPs (192.168.x.x, 10.x.x.x) are normal and not leaks.
        </p>
      </Card>
    </div>
  );
}
