import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History as HistoryIcon,
  Trash2,
  ArrowDown,
  ArrowUp,
  Zap,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getSpeedHistory, getPingHistory, clearAllHistory, type PingHistoryEntry } from "@/lib/local-storage";
import type { SpeedTestResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [speedHistory, setSpeedHistory] = useState<SpeedTestResult[]>([]);
  const [pingHistory, setPingHistory] = useState<PingHistoryEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setSpeedHistory(getSpeedHistory());
    setPingHistory(getPingHistory());
  }, []);

  const handleClear = () => {
    clearAllHistory();
    setSpeedHistory([]);
    setPingHistory([]);
    toast({ title: "History cleared" });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Test History</h2>
        </div>
        {(speedHistory.length > 0 || pingHistory.length > 0) && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={handleClear} data-testid="button-clear-history">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <Tabs defaultValue="speed" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="speed" className="flex-1" data-testid="tab-speed-history">
            Speed ({speedHistory.length})
          </TabsTrigger>
          <TabsTrigger value="ping" className="flex-1" data-testid="tab-ping-history">
            Ping ({pingHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="speed" className="mt-4 space-y-3">
          {speedHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No speed tests yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run a speed test to see results here</p>
            </Card>
          ) : (
            speedHistory.map((result) => (
              <Card key={result.id} className="p-4" data-testid={`card-speed-result-${result.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatTime(result.timestamp)}</span>
                  </div>
                  {result.server && (
                    <Badge variant="outline" className="text-[10px]">{result.server}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ArrowDown className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Down</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{result.download.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Mbps</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ArrowUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Up</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{result.upload.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Mbps</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">Ping</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{result.ping.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">ms</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="ping" className="mt-4 space-y-2">
          {pingHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No ping tests yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run a ping test to see results here</p>
            </Card>
          ) : (
            pingHistory.map((entry, i) => (
              <Card key={i} className="p-3" data-testid={`card-ping-result-${i}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.alive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-mono font-medium">{entry.host}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.time !== null ? (
                      <p className="text-sm font-bold tabular-nums">{entry.time.toFixed(1)}ms</p>
                    ) : (
                      <p className="text-sm text-red-500 font-medium">Failed</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">Stored Locally</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All test history is stored on your device using local storage. No account needed.
          Data persists between sessions and is never sent to external servers.
        </p>
      </Card>
    </div>
  );
}
