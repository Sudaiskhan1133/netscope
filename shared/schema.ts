import { z } from "zod";

export const speedTestResultSchema = z.object({
  id: z.string(),
  download: z.number(),
  upload: z.number(),
  ping: z.number(),
  timestamp: z.number(),
  server: z.string().optional(),
});

export const pingResultSchema = z.object({
  host: z.string(),
  alive: z.boolean(),
  time: z.number().nullable(),
  packetLoss: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  avg: z.number().optional(),
});

export const dnsRecordSchema = z.object({
  type: z.string(),
  value: z.string(),
  ttl: z.number().optional(),
});

export const dnsResultSchema = z.object({
  domain: z.string(),
  records: z.array(dnsRecordSchema),
});

export const ipInfoSchema = z.object({
  ip: z.string(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  org: z.string().optional(),
  timezone: z.string().optional(),
  loc: z.string().optional(),
});

export const whoisResultSchema = z.object({
  domain: z.string(),
  data: z.string(),
});

export type SpeedTestResult = z.infer<typeof speedTestResultSchema>;
export type PingResult = z.infer<typeof pingResultSchema>;
export type DnsRecord = z.infer<typeof dnsRecordSchema>;
export type DnsResult = z.infer<typeof dnsResultSchema>;
export type IpInfo = z.infer<typeof ipInfoSchema>;
export type WhoisResult = z.infer<typeof whoisResultSchema>;
