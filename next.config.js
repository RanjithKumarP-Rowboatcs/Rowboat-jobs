/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep these Node-only document parsers out of Next.js's server bundler.
  // pdf-parse 1.1.1 contains a debug/test file reference that can break
  // Vercel builds when the package is bundled.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'word-extractor'],
}

module.exports = nextConfig
