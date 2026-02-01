import { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string | null {
  // Probeer verschillende headers voor IP-adres
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for kan meerdere IPs bevatten, neem de eerste
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  return null;
}
