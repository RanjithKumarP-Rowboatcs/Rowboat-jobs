/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Node-only document parsers out of the server bundle.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'word-extractor'],

  // Keep the fixed talent intake endpoint as the public /api/talent route.
  async rewrites() {
    return [{ source: '/api/talent', destination: '/api/talent-fixed' }]
  },
}

module.exports = nextConfig
