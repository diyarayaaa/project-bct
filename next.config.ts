import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan akses chunk dev resources dari IP LAN dan perangkat lain
  allowedDevOrigins: [
    "192.168.18.66",
    "192.168.18.66:3005",
    "192.168.18.66:3000",
    "localhost",
    "localhost:3005",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3005",
    "192.168.*",
    "10.*",
    "172.*"
  ]
};

export default nextConfig;
