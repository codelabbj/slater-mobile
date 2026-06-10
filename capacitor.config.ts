import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.slater.android",
  appName: "Slater",
  webDir: "out",
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      serverClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      forceCodeForRefreshToken: true,
    },
  },
  server: {
    url: "https://slaterci-mobile-app.vercel.app", // décommente pour la prod
    cleartext: false
  },
}

export default config
