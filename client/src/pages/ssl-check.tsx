import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building,
  Globe,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sslCheck } from "@/lib/api";

interface SslResult {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  protocol: string;
  serialNumber: string;
  fingerprint: string;
  error?: string;
}

export default function SslCheck() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<SslResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const { toast } = useToast();

  const checkSsl = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setResult(null);
    setQueried(true);

    try {
      const data = await sslCheck(domain.trim());
      if (data.error && !data.valid) {
        toast({ title: "SSL Check Failed", description: data.error, variant: "destructive" });
      }
      setResult(data);
    } catch {
      toast({ title: "SSL Check Failed", variant: "destructive" });
    }
    setLoading(false);
  };

  const getStatusColor = () => {
    if (!result) return "";
    if (!result.valid) return "from-red-500 to-rose-600";
    if (result.daysRemaining < 30) return "from-amber-500 to-orange-600";
    return "from-emerald-500 to-green-600";
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">SSL Certificate Checker</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. google.com)"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && checkSsl()}
            data-testid="input-ssl-domain"
          />
          <Button onClick={checkSsl} disabled={loading || !domain.trim()} data-testid="button-ssl-check">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["google.com", "github.com", "expired.badssl.com"].map((preset) => (
            <Badge
              key={preset}
              variant="secondary"
              className="cursor-pointer text-xs"
              onClick={() => setDomain(preset)}
              data-testid={`badge-ssl-preset-${preset}`}
            >
              {preset}
            </Badge>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Checking SSL certificate...</p>
        </Card>
      )}

      {result && !loading && (
        <>
          <Card className="overflow-hidden">
            <div className={`p-5 text-white bg-gradient-to-br ${getStatusColor()}`}>
              <div className="flex items-center gap-3">
                {result.valid ? (
                  result.daysRemaining < 30 ? (
                    <AlertTriangle className="w-10 h-10" />
                  ) : (
                    <ShieldCheck className="w-10 h-10" />
                  )
                ) : (
                  <ShieldAlert className="w-10 h-10" />
                )}
                <div>
                  <h2 className="text-lg font-bold" data-testid="text-ssl-status">
                    {result.valid
                      ? result.daysRemaining < 30
                        ? "Expiring Soon"
                        : "SSL Valid"
                      : "SSL Invalid"}
                  </h2>
                  <p className="text-sm opacity-90">
                    {result.valid
                      ? `${result.daysRemaining} days remaining`
                      : result.error || "Certificate is invalid"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {result.valid && (
            <Card className="p-4">
              <div className="space-y-0 divide-y divide-border">
                {[
                  { icon: Building, label: "Issuer", value: result.issuer },
                  { icon: Globe, label: "Subject", value: result.subject },
                  ...(result.validFrom ? [{ icon: Calendar, label: "Valid From", value: new Date(result.validFrom).toLocaleDateString() }] : []),
                  ...(result.validTo ? [{ icon: Calendar, label: "Valid Until", value: new Date(result.validTo).toLocaleDateString() }] : []),
                  { icon: Lock, label: "Protocol", value: result.protocol || "TLS" },
                  { icon: CheckCircle2, label: "Days Remaining", value: `${result.daysRemaining} days` },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-medium truncate" data-testid={`text-ssl-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      <Card className="p-4">
        <h4 className="text-xs font-semibold mb-2">How it works</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This tool connects to the specified domain over HTTPS and retrieves the SSL/TLS
          certificate details. It checks if the certificate is valid, who issued it, and when
          it expires. Useful for monitoring your websites' certificates before they expire.
        </p>
      </Card>
    </div>
  );
}
