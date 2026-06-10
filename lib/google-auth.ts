import { Capacitor } from "@capacitor/core"
import api from "./api"
import { saveAuthData, type AuthResponse } from "./auth"

export interface GoogleAuthResult {
  success: boolean
  error?: string
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const platform = Capacitor.getPlatform()

  try {
    let idToken: string | null = null

    if (platform === "android" || platform === "ios") {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth")
      await GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        scopes: ["profile", "email"],
        grantOfflineAccess: true,
      })
      const googleUser = await GoogleAuth.signIn()
      idToken = googleUser?.authentication?.idToken ?? null

      if (!idToken) {
        return { success: false, error: "Impossible d'obtenir le token Google" }
      }
    } else {
      idToken = await new Promise<string | null>((resolve) => {
        if (typeof window === "undefined" || !(window as any).google) {
          resolve(null)
          return
        }
        ;(window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          callback: (response: { credential: string }) => {
            resolve(response.credential)
          },
        })
        ;(window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            resolve(null)
          }
        })
      })

      if (!idToken) {
        return { success: false, error: "Connexion Google annulée" }
      }
    }

    const response = await api.post<AuthResponse>("/auth/google", {
      id_token: idToken,
    })
    await saveAuthData(response.data)
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || error?.error || "Erreur lors de la connexion avec Google",
    }
  }
}
