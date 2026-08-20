/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Permitir acceso dev desde la IP Tailscale (iPhone) y la IP de la LAN
  allowedDevOrigins: ['100.109.82.30', '192.168.40.28'],
}

export default nextConfig
