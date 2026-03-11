import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, FileText, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dnsLookup } from "@/lib/api";

interface DnsRecord {
  type: string;
  value: string;
  ttl?: number;
}

export default function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [queried, setQueried] = useState(false);
  const { toast } = useToast();

  const lookup = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setRecords([]);
    setQueried(true);

    try {
      const data = await dnsLookup(domain.trim(), recordType);
      if (data.error) {
        toast({ title: "DNS Lookup Failed", description: data.error, variant: "destructive" });
      } else {
        setRecords(data.records || []);
      }
    } catch {
      toast({ title: "DNS Lookup Failed", variant: "destructive" });
    }
    setLoading(false);
  };

  const copyRecord = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">DNS Lookup</h3>
        </div>
        <div className="space-y-3">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. google.com)"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            data-testid="input-dns-domain"
          />
          <div className="flex gap-2">
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger className="w-28" data-testid="select-record-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"].map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={lookup} disabled={loading || !domain.trim()} className="flex-1" data-testid="button-dns-lookup">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Lookup
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["google.com", "github.com", "cloudflare.com"].map((preset) => (
            <Badge
              key={preset}
              variant="secondary"
              className="cursor-pointer text-xs"
              onClick={() => setDomain(preset)}
              data-testid={`badge-dns-preset-${preset}`}
            >
              {preset}
            </Badge>
          ))}
        </div>
      </Card>

      {queried && !loading && records.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No records found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different record type</p>
        </Card>
      )}

      {records.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {records.length} {recordType} record{records.length !== 1 ? "s" : ""} found
            </p>
            <Badge variant="outline" className="text-xs">{recordType}</Badge>
          </div>
          <div className="divide-y divide-border">
            {records.map((record, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{record.type}</p>
                    <p className="text-sm font-mono break-all" data-testid={`text-dns-record-${i}`}>
                      {record.value}
                    </p>
                    {record.ttl !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-1">TTL: {record.ttl}s</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyRecord(record.value)}
                    data-testid={`button-copy-record-${i}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
