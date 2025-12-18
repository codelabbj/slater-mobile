import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.slater.app",
  appName: "Slater",
  webDir: "out",
  //bundledWebRuntime: false,
  // plugins: {
  //   CapacitorUpdater: {
  //     autoUpdate: false
  //   }
  // },
  // plugins: {
  //   CapacitorUpdater: {
  //     autoUpdate: true,
  //     server: "https://slater-mobile-app-1-p3ef20nbk-codelabbjgmailcoms-projects.vercel.app",
  //   }
  // },
  server: {
    // androidScheme: "https",
    url: "https://slaterci-mobile-app.vercel.app",
    cleartext: false
  },
}

export default config
