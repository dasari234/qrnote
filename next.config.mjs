const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.ngrok-free.dev"]
    }
  }
};

export default nextConfig;