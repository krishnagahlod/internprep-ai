import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // We proxy this to Railway to bypass aggressive campus DNS firewalls (like Eduroam/IITB Wi-Fi)
        destination: 'https://internprep-ai-production.up.railway.app/:path*',
      },
    ]
  },
};

export default nextConfig;
