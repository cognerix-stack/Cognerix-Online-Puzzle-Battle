/**
 * Cleanly extracts and normalizes the client IP address from an incoming HTTP request or WebSocket client reference.
 * Correctly parses reverse proxy chains (e.g. Railway, Cloudflare), takes the true client IP,
 * and strips IPv6-mapped IPv4 prefixes (::ffff:).
 */
export function getClientIp(req: any): string {
  if (!req) return '';

  // 1. Check x-forwarded-for header (string or array) from HTTP request or WebSocket ref
  const forwarded = req.headers?.['x-forwarded-for'] || (req.ref as any)?.headers?.['x-forwarded-for'];
  if (forwarded) {
    const headerStr = Array.isArray(forwarded) ? forwarded[0] : String(forwarded);
    // Take the leftmost IP in the proxy chain (the original client)
    const firstIp = headerStr.split(',')[0].trim();
    if (firstIp) {
      return normalizeIp(firstIp);
    }
  }

  // 2. Check req.ip (populated accurately by Express when 'trust proxy' is enabled)
  if (req.ip) {
    return normalizeIp(String(req.ip));
  }

  // 3. Direct socket remote address
  const socketAddress =
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    (req.ref as any)?.socket?.remoteAddress;
  if (socketAddress) {
    return normalizeIp(String(socketAddress));
  }

  return '';
}

function normalizeIp(ip: string): string {
  if (!ip) return '';
  // Remove IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
  return ip.replace(/^::ffff:/, '').trim();
}