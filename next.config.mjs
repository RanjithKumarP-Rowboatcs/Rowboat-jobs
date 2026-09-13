/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/talent', destination: '/api/talent-fixed' }]
  },
}
export default nextConfig
