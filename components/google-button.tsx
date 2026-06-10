"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithGoogle } from "@/lib/google-auth"
import { unifiedFcmService } from "@/lib/firebase"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"

interface GoogleButtonProps {
  mode?: "login" | "register"
  disabled?: boolean
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function GoogleButton({ mode = "login", disabled = false }: GoogleButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const label = mode === "register" ? "S'inscrire avec Google" : "Continuer avec Google"

  const handlePress = async () => {
    if (isLoading || disabled) return
    setIsLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        toast.success(mode === "register" ? "Compte créé avec succès!" : "Connexion réussie!")
        try { await unifiedFcmService.sendTokenAfterLogin() } catch {}
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Erreur lors de la connexion avec Google")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-slate-400 font-medium">ou</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePress}
        disabled={isLoading || disabled}
        className="
          w-full flex items-center justify-center gap-3
          h-10 sm:h-11 px-4
          rounded-md
          border border-slate-200
          bg-white
          text-slate-700 font-medium text-sm sm:text-base
          shadow-sm
          hover:bg-slate-50 hover:shadow-md
          active:scale-[0.98]
          transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
        "
        aria-label={label}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 shrink-0" />
        ) : (
          <GoogleIcon />
        )}
        <span>{isLoading ? "Chargement..." : label}</span>
      </button>
    </div>
  )
}
