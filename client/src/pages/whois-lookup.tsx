import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Loader2, Search, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WhoisLookup() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const { toast } = useToast();

  const lookup = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setResult(null);
    setQueried(true);

    try {
      const res = await fetch("/api/whois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "WHOIS Lookup Failed", description: data.error, variant: "destructive" });
      } else {
        setResult(data.data || "No data available");
      }
    } catch {
      toast({ title: "WHOIS Lookup Failed", variant: "destructive" });
    }
    setLoading(false);
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast({ title: "Copied to clipboard" });
    }
  };

  const parseKeyValues = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("%") && !l.startsWith("#"));
    const pairs: { key: string; value: string }[] = [];
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        pairs.push({
          key: line.substring(0, colonIdx).trim(),
          value: line.substring(colonIdx + 1).trim(),
        });
      }
    }
    return pairs;
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">WHOIS Lookup</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. example.com)"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            data-testid="input-whois-domain"
          />
          <Button onClick={lookup} disabled={loading || !domain.trim()} data-testid="button-whois-lookup">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["google.com", "github.com", "example.com"].map((preset) => (
            <Badge
              key={preset}
              variant="secondary"
              className="cursor-pointer text-xs"
              onClick={() => setDomain(preset)}
              data-testid={`badge-whois-preset-${preset}`}
            >
              {preset}
            </Badge>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Looking up domain info...</p>
        </Card>
      )}

      {queried && !loading && !result && (
        <Card className="p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No WHOIS data found</p>
        </Card>
      )}

      {result && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">WHOIS Data</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyResult} data-testid="button-copy-whois">
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-0 divide-y divide-border/50">
              {parseKeyValues(result).length > 3 ? (
                parseKeyValues(result).map((pair, i) => (
                  <div key={i} className="py-2 first:pt-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{pair.key}</p>
                    <p className="text-sm font-mono break-all" data-testid={`text-whois-${i}`}>{pair.value}</p>
                  </div>
                ))
              ) : (
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all" data-testid="text-whois-raw">
                  {result}
                </pre>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
