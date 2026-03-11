import type { Express } from "express";
import { createServer, type Server } from "http";
import dns from "dns";
import { promisify } from "util";
import https from "https";
import http from "http";
import crypto from "crypto";
import tls from "tls";
import net from "net";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);
const resolveSoa = promisify(dns.resolveSoa);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.head("/api/ping-check", (_req, res) => {
    res.sendStatus(200);
  });

  app.get("/api/speed-test/download", (req, res) => {
    const sizeMB = parseInt(req.query.size as string) || 1;
    const bytes = Math.min(sizeMB, 10) * 1024 * 1024;
    const buffer = crypto.randomBytes(bytes);
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Length": bytes.toString(),
      "Cache-Control": "no-store",
    });
    res.send(buffer);
  });

  app.post("/api/speed-test/upload", (req, res) => {
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
    });
    req.on("end", () => {
      res.json({ received: size });
    });
  });

  app.get("/api/ip-info", async (req, res) => {
    try {
      const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
        req.socket.remoteAddress || "unknown";

      const fetchIpInfo = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          https.get("https://ipapi.co/json/", (response) => {
            let data = "";
            response.on("data", (chunk) => { data += chunk; });
            response.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve({ ip: clientIp });
              }
            });
          }).on("error", () => {
            resolve({ ip: clientIp });
          });
        });
      };

      const info = await fetchIpInfo();
      res.json({
        ip: info.ip || clientIp,
        city: info.city,
        region: info.region,
        country: info.country_name || info.country,
        org: info.org,
        timezone: info.timezone,
        loc: info.latitude && info.longitude ? `${info.latitude},${info.longitude}` : undefined,
      });
    } catch {
      res.json({ ip: "unknown" });
    }
  });

  app.post("/api/ping", async (req, res) => {
    const { host } = req.body;
    if (!host || typeof host !== "string") {
      return res.status(400).json({ error: "Host is required" });
    }

    const sanitized = host.replace(/[^a-zA-Z0-9.\-]/g, "");
    if (!sanitized || sanitized.length > 253) {
      return res.status(400).json({ error: "Invalid host" });
    }

    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(sanitized);

    function isPrivateIp(ip: string): boolean {
      const parts = ip.split(".").map(Number);
      if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 127) return true;
      if (parts[0] === 0) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
      return false;
    }

    if (isIp && isPrivateIp(sanitized)) {
      return res.status(400).json({ error: "Cannot ping private/reserved IP addresses" });
    }

    try {
      const result = await new Promise<{ alive: boolean; time: number | null }>((resolve) => {
        const lookupStart = Date.now();

        const dnsLookup = isIp
          ? Promise.resolve([sanitized])
          : new Promise<string[]>((res, rej) => {
              dns.resolve4(sanitized, (err, addrs) => (err ? rej(err) : res(addrs)));
            });

        dnsLookup
          .then((addresses) => {
            const ip = addresses[0];
            if (isPrivateIp(ip)) {
              resolve({ alive: false, time: null });
              return;
            }
            const time = Date.now() - lookupStart;
            resolve({ alive: true, time });
          })
          .catch(() => {
            resolve({ alive: false, time: null });
          });

        setTimeout(() => resolve({ alive: false, time: null }), 10000);
      });
      res.json(result);
    } catch {
      res.json({ alive: false, time: null });
    }
  });

  app.post("/api/dns-lookup", async (req, res) => {
    const { domain, recordType = "A" } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Domain is required" });
    }

    const sanitized = domain.replace(/[^a-zA-Z0-9.\-]/g, "");
    if (!sanitized) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    try {
      let records: Array<{ type: string; value: string; ttl?: number }> = [];

      switch (recordType.toUpperCase()) {
        case "A": {
          const addresses = await resolve4(sanitized);
          records = addresses.map((addr) => ({ type: "A", value: addr }));
          break;
        }
        case "AAAA": {
          const addresses = await resolve6(sanitized);
          records = addresses.map((addr) => ({ type: "AAAA", value: addr }));
          break;
        }
        case "MX": {
          const mxRecords = await resolveMx(sanitized);
          records = mxRecords.map((mx) => ({
            type: "MX",
            value: `${mx.priority} ${mx.exchange}`,
          }));
          break;
        }
        case "TXT": {
          const txtRecords = await resolveTxt(sanitized);
          records = txtRecords.map((txt) => ({
            type: "TXT",
            value: txt.join(""),
          }));
          break;
        }
        case "NS": {
          const nsRecords = await resolveNs(sanitized);
          records = nsRecords.map((ns) => ({ type: "NS", value: ns }));
          break;
        }
        case "CNAME": {
          const cnameRecords = await resolveCname(sanitized);
          records = cnameRecords.map((cname) => ({ type: "CNAME", value: cname }));
          break;
        }
        case "SOA": {
          const soa = await resolveSoa(sanitized);
          records = [{
            type: "SOA",
            value: `${soa.nsname} ${soa.hostmaster} (serial: ${soa.serial}, refresh: ${soa.refresh}, retry: ${soa.retry}, expire: ${soa.expire}, minttl: ${soa.minttl})`,
          }];
          break;
        }
        default:
          return res.status(400).json({ error: "Unsupported record type" });
      }

      res.json({ domain: sanitized, records });
    } catch (err: any) {
      res.json({ domain: sanitized, records: [], error: err.message });
    }
  });

  app.post("/api/ssl-check", async (req, res) => {
    const { host } = req.body;
    if (!host || typeof host !== "string") {
      return res.status(400).json({ error: "Host is required" });
    }

    const sanitized = host.replace(/[^a-zA-Z0-9.\-]/g, "");
    if (!sanitized) {
      return res.status(400).json({ error: "Invalid host" });
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const socket = tls.connect(
          { host: sanitized, port: 443, servername: sanitized, rejectUnauthorized: false },
          () => {
            const cert = socket.getPeerCertificate();
            if (!cert || !cert.subject) {
              socket.end();
              reject(new Error("No certificate found"));
              return;
            }

            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const valid = socket.authorized || (now >= validFrom && now <= validTo);

            resolve({
              valid,
              issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown",
              subject: cert.subject?.CN || sanitized,
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              daysRemaining: Math.max(0, daysRemaining),
              protocol: socket.getProtocol() || "TLS",
              serialNumber: cert.serialNumber || "",
              fingerprint: cert.fingerprint256 || cert.fingerprint || "",
            });
            socket.end();
          }
        );

        socket.on("error", (err: Error) => {
          reject(err);
        });

        socket.setTimeout(10000, () => {
          socket.destroy();
          reject(new Error("Connection timed out"));
        });
      });

      res.json(result);
    } catch (err: any) {
      res.json({
        valid: false,
        error: err.message || "SSL check failed",
        issuer: "",
        subject: sanitized,
        validFrom: "",
        validTo: "",
        daysRemaining: 0,
        protocol: "",
        serialNumber: "",
        fingerprint: "",
      });
    }
  });

  app.post("/api/whois", async (req, res) => {
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Domain is required" });
    }

    const sanitized = domain.replace(/[^a-zA-Z0-9.\-]/g, "");
    if (!sanitized) {
      return res.status(400).json({ error: "Invalid domain" });
    }

    try {
      const whoisData = await new Promise<string>((resolve, reject) => {
        const tld = sanitized.split(".").pop()?.toLowerCase() || "com";
        const whoisServers: Record<string, string> = {
          com: "whois.verisign-grs.com",
          net: "whois.verisign-grs.com",
          org: "whois.pir.org",
          io: "whois.nic.io",
          dev: "whois.nic.google",
          app: "whois.nic.google",
          me: "whois.nic.me",
          co: "whois.nic.co",
        };

        const server = whoisServers[tld] || `whois.nic.${tld}`;
        const client = net.createConnection({ host: server, port: 43 }, () => {
          client.write(sanitized + "\r\n");
        });

        let data = "";
        client.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        client.on("end", () => resolve(data));
        client.on("error", (err: Error) => reject(err));
        client.setTimeout(10000, () => {
          client.destroy();
          reject(new Error("WHOIS lookup timed out"));
        });
      });

      res.json({ domain: sanitized, data: whoisData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "WHOIS lookup failed" });
    }
  });

  return httpServer;
}
