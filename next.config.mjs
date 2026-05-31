/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/precos', destination: '/', permanent: false },
      { source: '/dashboard/gamificacao', destination: '/dashboard', permanent: false },
      { source: '/dashboard/recompensas', destination: '/dashboard', permanent: false },
    ]
  },
}

export default nextConfig
