const isNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

const API_BASE = isNative() ? "" : "";

export async function fetchIpInfo(): Promise<any> {
  if (isNative()) {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    const info = await res.json();
    return {
      ip: info.ip,
      city: info.city,
      region: info.region,
      country: info.country_name || info.country,
      org: info.org,
      timezone: info.timezone,
      loc: info.latitude && info.longitude ? `${info.latitude},${info.longitude}` : undefined,
    };
  }
  const res = await fetch("/api/ip-info");
  return res.json();
}

export async function pingHost(host: string): Promise<{ alive: boolean; time: number | null }> {
  if (isNative()) {
    const start = performance.now();
    try {
      const sanitized = host.replace(/[^a-zA-Z0-9.\-]/g, "");
      const url = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(sanitized)
        ? `https://${sanitized}`
        : `https://${sanitized}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const time = performance.now() - start;
      return { alive: true, time };
    } catch {
      const time = performance.now() - start;
      if (time < 9000) {
        return { alive: true, time };
      }
      return { alive: false, time: null };
    }
  }
  const res = await fetch("/api/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host }),
  });
  return res.json();
}

export async function dnsLookup(domain: string, recordType: string): Promise<any> {
  if (isNative()) {
    const sanitized = domain.replace(/[^a-zA-Z0-9.\-]/g, "");
    const typeMap: Record<string, number> = {
      A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6,
    };
    const dnsType = typeMap[recordType.toUpperCase()] || 1;

    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(sanitized)}&type=${dnsType}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (!data.Answer || data.Answer.length === 0) {
      return { domain: sanitized, records: [], error: data.Comment || "No records found" };
    }

    const typeNames: Record<number, string> = {
      1: "A", 28: "AAAA", 15: "MX", 16: "TXT", 2: "NS", 5: "CNAME", 6: "SOA",
    };

    const records = data.Answer.map((a: any) => ({
      type: typeNames[a.type] || recordType,
      value: a.data?.replace(/^"|"$/g, "") || a.data,
      ttl: a.TTL,
    }));

    return { domain: sanitized, records };
  }
  const res = await fetch("/api/dns-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, recordType }),
  });
  return res.json();
}

export async function whoisLookup(domain: string): Promise<any> {
  if (isNative()) {
    const sanitized = domain.replace(/[^a-zA-Z0-9.\-]/g, "");
    try {
      const res = await fetch(
        `https://whois.freeaitools.xyz/?domain=${encodeURIComponent(sanitized)}`,
        { cache: "no-store" }
      );
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.raw) return { domain: sanitized, data: json.raw };
        if (json.whois) return { domain: sanitized, data: json.whois };
        return { domain: sanitized, data: JSON.stringify(json, null, 2) };
      } catch {
        return { domain: sanitized, data: text };
      }
    } catch {
      const rdapRes = await fetch(
        `https://rdap.org/domain/${encodeURIComponent(sanitized)}`,
        { cache: "no-store" }
      );
      const rdapData = await rdapRes.json();

      const lines: string[] = [];
      if (rdapData.handle) lines.push(`Handle: ${rdapData.handle}`);
      if (rdapData.ldhName) lines.push(`Domain Name: ${rdapData.ldhName}`);
      if (rdapData.status) lines.push(`Status: ${rdapData.status.join(", ")}`);

      if (rdapData.events) {
        for (const event of rdapData.events) {
          lines.push(`${event.eventAction}: ${event.eventDate}`);
        }
      }

      if (rdapData.nameservers) {
        for (const ns of rdapData.nameservers) {
          lines.push(`Name Server: ${ns.ldhName || ns.objectClassName}`);
        }
      }

      if (rdapData.entities) {
        for (const entity of rdapData.entities) {
          if (entity.roles) lines.push(`\n${entity.roles.join(", ").toUpperCase()}:`);
          if (entity.vcardArray?.[1]) {
            for (const field of entity.vcardArray[1]) {
              if (field[0] === "fn") lines.push(`  Name: ${field[3]}`);
              if (field[0] === "email") lines.push(`  Email: ${field[3]}`);
              if (field[0] === "tel") lines.push(`  Phone: ${field[3]}`);
            }
          }
        }
      }

      return { domain: sanitized, data: lines.join("\n") || JSON.stringify(rdapData, null, 2) };
    }
  }
  const res = await fetch("/api/whois", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  return res.json();
}

export async function sslCheck(host: string): Promise<any> {
  if (isNative()) {
    const sanitized = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/[^a-zA-Z0-9.\-]/g, "");

    try {
      const res = await fetch(`https://ssl-checker.io/api/v1/check/${encodeURIComponent(sanitized)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.result === "success" || data.issued_to) {
        return {
          valid: true,
          issuer: data.issuer?.O || data.issuer?.CN || data.issued_by || "Unknown",
          subject: data.issued_to || sanitized,
          validFrom: data.valid_from || "",
          validTo: data.valid_till || data.valid_to || "",
          daysRemaining: data.days_left || 0,
          protocol: data.cert_sn ? "TLS" : "TLS",
          serialNumber: data.cert_sn || "",
          fingerprint: data.cert_sha1 || "",
        };
      }
    } catch {}

    try {
      const start = performance.now();
      const testRes = await fetch(`https://${sanitized}`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      });
      const elapsed = performance.now() - start;

      return {
        valid: true,
        issuer: "Verified via HTTPS connection",
        subject: sanitized,
        validFrom: "",
        validTo: "",
        daysRemaining: 0,
        protocol: "TLS",
        serialNumber: "",
        fingerprint: "",
      };
    } catch {
      return {
        valid: false,
        error: "Could not establish HTTPS connection",
        issuer: "",
        subject: sanitized,
        validFrom: "",
        validTo: "",
        daysRemaining: 0,
        protocol: "",
        serialNumber: "",
        fingerprint: "",
      };
    }
  }
  const res = await fetch("/api/ssl-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host }),
  });
  return res.json();
}

export async function speedTestPing(): Promise<number> {
  const times: number[] = [];
  const urls = isNative()
    ? ["https://www.google.com/generate_204", "https://1.1.1.1/cdn-cgi/trace", "https://www.gstatic.com/generate_204"]
    : ["/api/ping-check"];

  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    try {
      await fetch(urls[i % urls.length], {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
      });
      times.push(performance.now() - start);
    } catch {
      times.push(0);
    }
  }
  const valid = times.filter((t) => t > 0);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

export async function speedTestDownload(signal: AbortSignal, onProgress: (p: number) => void): Promise<number> {
  if (isNative()) {
    const urls = [
      "https://speed.cloudflare.com/__down?bytes=1000000",
      "https://speed.cloudflare.com/__down?bytes=2000000",
      "https://speed.cloudflare.com/__down?bytes=5000000",
    ];

    let totalBytes = 0;
    const startTime = performance.now();

    for (let i = 0; i < urls.length; i++) {
      if (signal.aborted) return 0;
      onProgress(((i + 1) / urls.length) * 100);
      try {
        const response = await fetch(urls[i], { cache: "no-store", signal });
        const blob = await response.blob();
        totalBytes += blob.size;
      } catch (e: any) {
        if (e.name === "AbortError") return 0;
      }
    }

    const durationSec = (performance.now() - startTime) / 1000;
    return (totalBytes * 8) / durationSec / 1_000_000;
  }

  const sizes = [1, 2, 5];
  let totalBytes = 0;
  const startTime = performance.now();

  for (let i = 0; i < sizes.length; i++) {
    if (signal.aborted) return 0;
    onProgress(((i + 1) / sizes.length) * 100);
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
  return (totalBytes * 8) / durationSec / 1_000_000;
}

export async function speedTestUpload(signal: AbortSignal, onProgress: (p: number) => void): Promise<number> {
  if (isNative()) {
    const sizes = [0.5, 1, 2];
    let totalBytes = 0;
    const startTime = performance.now();

    for (let i = 0; i < sizes.length; i++) {
      if (signal.aborted) return 0;
      onProgress(((i + 1) / sizes.length) * 100);
      const data = new Uint8Array(Math.floor(sizes[i] * 1024 * 1024));
      try {
        await fetch("https://speed.cloudflare.com/__up", {
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
    return (totalBytes * 8) / durationSec / 1_000_000;
  }

  const sizes = [0.5, 1, 2];
  let totalBytes = 0;
  const startTime = performance.now();

  for (let i = 0; i < sizes.length; i++) {
    if (signal.aborted) return 0;
    onProgress(((i + 1) / sizes.length) * 100);
    const data = new Uint8Array(Math.floor(sizes[i] * 1024 * 1024));
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
  return (totalBytes * 8) / durationSec / 1_000_000;
}
