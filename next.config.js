/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  }
}

module.exports = nextConfig
