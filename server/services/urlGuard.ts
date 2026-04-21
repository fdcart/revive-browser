import dns from 'node:dns/promises';
import net from 'node:net';
import { config } from '../config';

const privateCidrs = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^0\./
];

function normalize(rawUrl: string): URL {
  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  const parsed = new URL(normalized);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed.');
  }
  return parsed;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
  }
  return privateCidrs.some((expr) => expr.test(ip));
}

function domainAllowed(hostname: string): boolean {
  if (config.blockDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return false;
  }
  if (config.allowDomains.length === 0) {
    return true;
  }
  return config.allowDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

export async function validateTargetUrl(rawUrl: string): Promise<URL> {
  const parsed = normalize(rawUrl);
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error('localhost is blocked.');
  }
  if (!domainAllowed(host)) {
    throw new Error('Domain is not allowed by policy.');
  }
  const lookup = await dns.lookup(host, { all: true });
  if (lookup.some((result) => isPrivateIp(result.address))) {
    throw new Error('Target resolved to a private network IP.');
  }
  return parsed;
}
