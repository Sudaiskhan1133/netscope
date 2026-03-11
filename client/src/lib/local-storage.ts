import type { SpeedTestResult } from "@shared/schema";

const SPEED_HISTORY_KEY = "network_toolkit_speed_history";
const PING_HISTORY_KEY = "network_toolkit_ping_history";
const SETTINGS_KEY = "network_toolkit_settings";
const SAVED_NETWORKS_KEY = "network_toolkit_saved_networks";

export interface PingHistoryEntry {
  host: string;
  time: number | null;
  alive: boolean;
  timestamp: number;
}

export interface SavedNetwork {
  id: string;
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  createdAt: number;
}

export interface AppSettings {
  darkMode: boolean;
  defaultPingHost: string;
  defaultDnsServer: string;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  defaultPingHost: "google.com",
  defaultDnsServer: "8.8.8.8",
};

export function getSpeedHistory(): SpeedTestResult[] {
  try {
    const data = localStorage.getItem(SPEED_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSpeedResult(result: SpeedTestResult) {
  const history = getSpeedHistory();
  history.unshift(result);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(SPEED_HISTORY_KEY, JSON.stringify(history));
}

export function getPingHistory(): PingHistoryEntry[] {
  try {
    const data = localStorage.getItem(PING_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePingResult(entry: PingHistoryEntry) {
  const history = getPingHistory();
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  localStorage.setItem(PING_HISTORY_KEY, JSON.stringify(history));
}

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function getSavedNetworks(): SavedNetwork[] {
  try {
    const data = localStorage.getItem(SAVED_NETWORKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveNetwork(network: Omit<SavedNetwork, "id" | "createdAt">): SavedNetwork {
  const networks = getSavedNetworks();
  const existing = networks.findIndex((n) => n.ssid === network.ssid);
  const saved: SavedNetwork = {
    ...network,
    id: generateId(),
    createdAt: Date.now(),
  };
  if (existing >= 0) {
    networks[existing] = saved;
  } else {
    networks.unshift(saved);
  }
  if (networks.length > 20) networks.length = 20;
  localStorage.setItem(SAVED_NETWORKS_KEY, JSON.stringify(networks));
  return saved;
}

export function deleteNetwork(id: string) {
  const networks = getSavedNetworks().filter((n) => n.id !== id);
  localStorage.setItem(SAVED_NETWORKS_KEY, JSON.stringify(networks));
}

export function clearAllHistory() {
  localStorage.removeItem(SPEED_HISTORY_KEY);
  localStorage.removeItem(PING_HISTORY_KEY);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
