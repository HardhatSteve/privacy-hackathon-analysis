/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID || "8pwts9jT9SPCd2iRYhTKQFYdHjtMmH5s14DNFauiju5x",
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || "devnet",
  },
}

module.exports = nextConfig
