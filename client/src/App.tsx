import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileLayout } from "@/components/mobile-layout";
import { SplashScreen } from "@/components/splash-screen";
import { useState, useCallback, useEffect } from "react";
import { initializeAdMob, showBanner, showInterstitialOnPageChange } from "@/lib/admob";
import Dashboard from "@/pages/dashboard";
import SpeedTest from "@/pages/speed-test";
import IpInfo from "@/pages/ip-info";
import PingTool from "@/pages/ping-tool";
import DnsLookup from "@/pages/dns-lookup";
import WhoisLookup from "@/pages/whois-lookup";
import SslCheck from "@/pages/ssl-check";
import WebRTCTest from "@/pages/webrtc-test";
import QrGenerator from "@/pages/qr-generator";
import HistoryPage from "@/pages/history";
import NotFound from "@/pages/not-found";

function AdTracker() {
  const [location] = useLocation();

  useEffect(() => {
    showInterstitialOnPageChange();
  }, [location]);

  return null;
}

function Router() {
  return (
    <MobileLayout>
      <AdTracker />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/speed-test" component={SpeedTest} />
        <Route path="/ip-info" component={IpInfo} />
        <Route path="/ping" component={PingTool} />
        <Route path="/dns" component={DnsLookup} />
        <Route path="/whois" component={WhoisLookup} />
        <Route path="/ssl-check" component={SslCheck} />
        <Route path="/webrtc" component={WebRTCTest} />
        <Route path="/qr-generator" component={QrGenerator} />
        <Route path="/history" component={HistoryPage} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    initializeAdMob().then(() => showBanner());
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
