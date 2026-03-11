import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Radio, Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { savePingResult } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { pingHost } from "@/lib/api";

interface PingEntry {
  seq: number;
  time: number | null;
  status: "success" | "timeout" | "pending";
}

export default function PingTool() {
  const [host, setHost] = useState("google.com");
  const [pinging, setPinging] = useState(false);
  const [entries, setEntries] = useState<PingEntry[]>([]);
  const [stats, setStats] = useState<{ min: number; max: number; avg: number; loss: number } | null>(null);
  const { toast } = useToast();

  const runPing = async () => {
    if (!host.trim()) return;
    setPinging(true);
    setEntries([]);
    setStats(null);

    const results: PingEntry[] = [];
    const count = 5;

    for (let i = 0; i < count; i++) {
      setEntries((prev) => [...prev, { seq: i + 1, time: null, status: "pending" }]);

      try {
        const data = await pingHost(host.trim());

        const entry: PingEntry = {
          seq: i + 1,
          time: data.time ? parseFloat(String(data.time)) : null,
          status: data.alive ? "success" : "timeout",
        };
        results.push(entry);
        setEntries((prev) => prev.map((e) => (e.seq === i + 1 ? entry : e)));
      } catch {
        const entry: PingEntry = { seq: i + 1, time: null, status: "timeout" };
        results.push(entry);
        setEntries((prev) => prev.map((e) => (e.seq === i + 1 ? entry : e)));
      }

      if (i < count - 1) await new Promise((r) => setTimeout(r, 500));
    }

    const successful = results.filter((r) => r.status === "success" && r.time !== null);
    const times = successful.map((r) => r.time!);

    if (times.length > 0) {
      setStats({
        min: Math.min(...times),
        max: Math.max(...times),
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        loss: ((count - successful.length) / count) * 100,
      });
    } else {
      setStats({ min: 0, max: 0, avg: 0, loss: 100 });
    }

    savePingResult({
      host: host.trim(),
      time: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null,
      alive: successful.length > 0,
      timestamp: Date.now(),
    });

    setPinging(false);
    toast({ title: "Ping complete" });
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Ping Host</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Enter hostname or IP"
            className="flex-1"
            disabled={pinging}
            onKeyDown={(e) => e.key === "Enter" && runPing()}
            data-testid="input-ping-host"
          />
          <Button onClick={runPing} disabled={pinging || !host.trim()} data-testid="button-ping">
            {pinging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {["google.com", "1.1.1.1", "8.8.8.8", "cloudflare.com"].map((preset) => (
            <Badge
              key={preset}
              variant="secondary"
              className="cursor-pointer text-xs"
              onClick={() => setHost(preset)}
              data-testid={`badge-preset-${preset}`}
            >
              {preset}
            </Badge>
          ))}
        </div>
      </Card>

      {entries.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Pinging {host}...
            </p>
          </div>
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.seq} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {entry.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
                  {entry.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {entry.status === "timeout" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  <span className="text-sm font-mono">seq={entry.seq}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {entry.status === "success" && entry.time !== null ? (
                    <>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-mono font-medium" data-testid={`text-ping-time-${entry.seq}`}>
                        {entry.time.toFixed(1)}ms
                      </span>
                    </>
                  ) : entry.status === "timeout" ? (
                    <span className="text-sm text-red-500 font-medium">Timeout</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-500 tabular-nums" data-testid="text-ping-min">
              {stats.min.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Min (ms)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold tabular-nums" data-testid="text-ping-avg">
              {stats.avg.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg (ms)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-amber-500 tabular-nums" data-testid="text-ping-max">
              {stats.max.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Max (ms)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className={`text-lg font-bold tabular-nums ${stats.loss > 0 ? "text-red-500" : "text-emerald-500"}`} data-testid="text-packet-loss">
              {stats.loss.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Loss</p>
          </Card>
        </div>
      )}
    </div>
  );
}
