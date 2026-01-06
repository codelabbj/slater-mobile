"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  const checkAuthentication = useCallback(async () => {
    try {
      const { ensureValidToken } = await import("@/lib/auth")
      const tokenValid = await ensureValidToken()

      if (!tokenValid) {
        console.log('No access token found, redirecting to login')
        router.push("/login")
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking authentication:', error)
      router.push("/login")
      return false
    }
  }, [router])

  useEffect(() => {
    const initialCheck = async () => {
      const isValid = await checkAuthentication()
      if (isValid) {
        setIsChecking(false)
      }
    }

    initialCheck()
  }, [checkAuthentication])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
