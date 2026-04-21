import dns from 'node:dns/promises';
import net from 'node:net';
import { appConfig } from './config';

const blockedHosts = ['localhost', '169.254.169.254', 'metadata.google.internal'];
const privateIpv4 = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^0\./];

export function normalizeUrl(input: string): URL {
  const raw = (input || '').trim();
  if (!raw) throw new Error('URL is required.');
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(normalized);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.');
  }
  return parsed;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  return privateIpv4.some((r) => r.test(ip));
}

function allowed(hostname: string): boolean {
  if (appConfig.blockDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) return false;
  if (!appConfig.allowDomains.length) return true;
  return appConfig.allowDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

export async function validateTargetUrl(input: string): Promise<URL> {
  const url = normalizeUrl(input);
  const host = url.hostname.toLowerCase();
  if (blockedHosts.includes(host) || host.endsWith('.localhost')) {
    throw new Error('This host is blocked by security policy.');
  }
  if (!allowed(host)) throw new Error('Domain not allowed by policy.');
  const records = await dns.lookup(host, { all: true });
  if (records.some((r) => isPrivateIp(r.address))) {
    throw new Error('Target resolves to private/internal network.');
  }
  return url;
}

export function isAppLikeSite(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h.includes('chatgpt.com') || h.includes('claude.ai') || h.includes('notion.so') || h.includes('figma.com');
}
