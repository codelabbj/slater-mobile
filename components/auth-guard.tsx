"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { isAuthenticated } = await import("@/lib/auth")
        const authenticated = await isAuthenticated()

        if (!authenticated) {
          router.push("/login")
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push("/login")
      }
    }

    checkAuthentication()
  }, [router])

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
