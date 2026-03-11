import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, Zap, Play, Square, RotateCcw } from "lucide-react";
import { saveSpeedResult, generateId } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { showInterstitialAfterSpeedTest } from "@/lib/admob";

type TestPhase = "idle" | "download" | "upload" | "complete";

export default function SpeedTest() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [ping, setPing] = useState(0);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const measurePing = useCallback(async () => {
    const times: number[] = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        await fetch("/api/ping-check", { method: "HEAD", cache: "no-store" });
        times.push(performance.now() - start);
      } catch {
        times.push(0);
      }
    }
    const valid = times.filter((t) => t > 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  }, []);

  const measureDownload = useCallback(async (signal: AbortSignal) => {
    const sizes = [1, 2, 5];
    let totalBytes = 0;
    const startTime = performance.now();

    for (let i = 0; i < sizes.length; i++) {
      if (signal.aborted) return 0;
      setProgress(((i + 1) / sizes.length) * 100);
      try {
        const response = await fetch(`/api/speed-test/download?size=${sizes[i]}`, {
          cache: "no-store",
          signal,
        });
        const blob = await response.blob();
        totalBytes += blob.size;
      } catch (e: any) {
        if (e.name === "AbortError") return 0;
      }
    }

    const durationSec = (performance.now() - startTime) / 1000;
    const bitsPerSec = (totalBytes * 8) / durationSec;
    return bitsPerSec / 1_000_000;
  }, []);

  const measureUpload = useCallback(async (signal: AbortSignal) => {
    const sizes = [0.5, 1, 2];
    let totalBytes = 0;
    const startTime = performance.now();

    for (let i = 0; i < sizes.length; i++) {
      if (signal.aborted) return 0;
      setProgress(((i + 1) / sizes.length) * 100);
      const data = new Uint8Array(sizes[i] * 1024 * 1024);
      try {
        await fetch("/api/speed-test/upload", {
          method: "POST",
          body: data,
          signal,
        });
        totalBytes += data.length;
      } catch (e: any) {
        if (e.name === "AbortError") return 0;
      }
    }

    const durationSec = (performance.now() - startTime) / 1000;
    const bitsPerSec = (totalBytes * 8) / durationSec;
    return bitsPerSec / 1_000_000;
  }, []);

  const startTest = async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("download");
    setDownload(0);
    setUpload(0);
    setPing(0);
    setProgress(0);

    try {
      const pingResult = await measurePing();
      setPing(pingResult);

      const dlSpeed = await measureDownload(controller.signal);
      if (controller.signal.aborted) return;
      setDownload(dlSpeed);

      setPhase("upload");
      setProgress(0);

      const ulSpeed = await measureUpload(controller.signal);
      if (controller.signal.aborted) return;
      setUpload(ulSpeed);

      setPhase("complete");

      saveSpeedResult({
        id: generateId(),
        download: dlSpeed,
        upload: ulSpeed,
        ping: pingResult,
        timestamp: Date.now(),
        server: "Local",
      });

      toast({ title: "Speed test complete", description: "Results saved to history" });
      showInterstitialAfterSpeedTest();
    } catch {
      setPhase("idle");
      toast({ title: "Test failed", description: "Could not complete speed test", variant: "destructive" });
    }
  };

  const stopTest = () => {
    abortRef.current?.abort();
    setPhase("idle");
  };

  const reset = () => {
    setPhase("idle");
    setDownload(0);
    setUpload(0);
    setPing(0);
    setProgress(0);
  };

  const isRunning = phase === "download" || phase === "upload";

  return (
    <div className="p-4 space-y-4">
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-2">
              {phase === "idle" && "Ready to Test"}
              {phase === "download" && "Testing Download..."}
              {phase === "upload" && "Testing Upload..."}
              {phase === "complete" && "Test Complete"}
            </p>
            <div className="text-5xl font-bold tabular-nums" data-testid="text-current-speed">
              {phase === "download"
                ? download.toFixed(1)
                : phase === "upload"
                ? upload.toFixed(1)
                : phase === "complete"
                ? download.toFixed(1)
                : "0.0"}
            </div>
            <p className="text-sm opacity-80 mt-1">Mbps</p>
          </div>

          {isRunning && (
            <div className="mb-4">
              <Progress value={progress} className="h-1.5 bg-white/20" />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {phase === "idle" && (
              <Button
                onClick={startTest}
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 rounded-full"
                data-testid="button-start-test"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </Button>
            )}
            {isRunning && (
              <Button
                onClick={stopTest}
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full"
                data-testid="button-stop-test"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
            {phase === "complete" && (
              <Button
                onClick={reset}
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 rounded-full"
                data-testid="button-retest"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Test Again
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <ArrowDown className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold tabular-nums" data-testid="text-download-speed">
            {download.toFixed(1)}
          </p>
          <p className="text-[11px] text-muted-foreground">Download</p>
          <p className="text-[10px] text-muted-foreground">Mbps</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <ArrowUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold tabular-nums" data-testid="text-upload-speed">
            {upload.toFixed(1)}
          </p>
          <p className="text-[11px] text-muted-foreground">Upload</p>
          <p className="text-[10px] text-muted-foreground">Mbps</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold tabular-nums" data-testid="text-ping">
            {ping.toFixed(0)}
          </p>
          <p className="text-[11px] text-muted-foreground">Ping</p>
          <p className="text-[10px] text-muted-foreground">ms</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">About Speed Test</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This tool measures your connection speed by downloading and uploading data to the server.
          Results are approximate and saved locally to your device for tracking over time.
          Works best with a stable connection.
        </p>
      </Card>
    </div>
  );
}
