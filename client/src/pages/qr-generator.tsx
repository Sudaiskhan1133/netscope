import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Download,
  Wifi,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Share2,
  BookmarkPlus,
  Star,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  getSavedNetworks,
  saveNetwork,
  deleteNetwork,
  type SavedNetwork,
} from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";

type SecurityType = "WPA" | "WEP" | "nopass";

export default function QrGenerator() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<SecurityType>("WPA");
  const [showPassword, setShowPassword] = useState(false);
  const [savedNetworks, setSavedNetworks] = useState<SavedNetwork[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSavedNetworks(getSavedNetworks());
  }, []);

  const wifiString = `WIFI:T:${security};S:${ssid};P:${security === "nopass" ? "" : password};;`;
  const hasValidInput = ssid.trim().length > 0;

  const handleSaveNetwork = () => {
    if (!ssid.trim()) return;
    saveNetwork({ ssid: ssid.trim(), password, security });
    setSavedNetworks(getSavedNetworks());
    toast({ title: "Network saved", description: `"${ssid}" saved for quick access` });
  };

  const handleDeleteNetwork = (id: string) => {
    deleteNetwork(id);
    setSavedNetworks(getSavedNetworks());
    if (activeNetwork === id) setActiveNetwork(null);
    toast({ title: "Network removed" });
  };

  const loadNetwork = (network: SavedNetwork) => {
    setSsid(network.ssid);
    setPassword(network.password);
    setSecurity(network.security);
    setActiveNetwork(network.id);
  };

  const getCanvasFromQR = (): HTMLCanvasElement | null => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    canvas.width = 512;
    canvas.height = 512;
    return canvas;
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `wifi-${ssid.replace(/\s/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  };

  const shareQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = async () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      URL.revokeObjectURL(url);
      try {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob && navigator.share) {
          const file = new File([blob], `wifi-${ssid}.png`, { type: "image/png" });
          await navigator.share({
            title: `WiFi: ${ssid}`,
            text: `Scan this QR code to connect to "${ssid}"`,
            files: [file],
          });
        } else {
          downloadQR();
        }
      } catch {
        downloadQR();
      }
    };
    img.src = url;
  };

  return (
    <div className="p-4 space-y-4">
      {savedNetworks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Saved Networks</h3>
            <Badge variant="secondary" className="text-xs ml-auto">{savedNetworks.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tap a saved network to instantly generate its QR code
          </p>
          <div className="space-y-2">
            {savedNetworks.map((network) => (
              <div
                key={network.id}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeNetwork === network.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => loadNetwork(network)}
                data-testid={`saved-network-${network.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Wifi className={`w-4 h-4 shrink-0 ${activeNetwork === network.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{network.ssid}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {network.security === "nopass" ? "Open" : network.security}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNetwork(network.id);
                  }}
                  data-testid={`button-delete-network-${network.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">WiFi Details</h3>
          <Badge variant="secondary" className="text-xs ml-auto">Works Offline</Badge>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">Network Name (SSID)</Label>
            <Input
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter your WiFi network name"
              data-testid="input-ssid"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Security Type</Label>
            <Select value={security} onValueChange={(v) => setSecurity(v as SecurityType)}>
              <SelectTrigger data-testid="select-security">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">No Password (Open)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {security !== "nopass" && (
            <div>
              <Label className="text-xs mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter WiFi password"
                  data-testid="input-wifi-password"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {hasValidInput && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSaveNetwork}
              data-testid="button-save-network"
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Save Network for Quick Access
            </Button>
          )}
        </div>
      </Card>

      {hasValidInput && (
        <Card className="p-6">
          <div className="text-center">
            <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl mb-4 shadow-sm">
              <QRCodeSVG
                value={wifiString}
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-sm font-semibold mb-0.5" data-testid="text-qr-ssid">{ssid}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {security === "nopass" ? "Open Network" : `${security} Protected`}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={shareQR} className="rounded-full" data-testid="button-share-qr">
                <Share2 className="w-4 h-4 mr-2" />
                Share QR
              </Button>
              <Button variant="outline" onClick={downloadQR} className="rounded-full" data-testid="button-download-qr">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!hasValidInput && savedNetworks.length === 0 && (
        <Card className="p-8 text-center">
          <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Enter your WiFi details above</p>
          <p className="text-xs text-muted-foreground mt-1">QR code will appear here</p>
        </Card>
      )}

      <Card className="p-4">
        <h4 className="text-xs font-semibold mb-2">How it works</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enter your WiFi network name and password once, save it, and generate a QR code
          that anyone can scan to instantly connect. Your credentials are stored only on
          your device - never sent anywhere. Share the QR image with guests instead of
          telling them your password. Works completely offline.
        </p>
      </Card>
    </div>
  );
}
