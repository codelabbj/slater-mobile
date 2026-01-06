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
        console.log('Authentication check failed, redirecting to login')
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

    // Set up periodic authentication checks every 5 minutes
    const intervalId = setInterval(async () => {
      console.log('Performing periodic authentication check...')
      await checkAuthentication()
    }, 5 * 60 * 1000) // 5 minutes

    // Set up visibility change listener to check auth when app becomes visible
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('App became visible, checking authentication...')
        await checkAuthentication()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkAuthentication])

  // Listen for storage changes (in case tokens are cleared from another tab)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        console.log('Token storage changed, re-checking authentication...')
        const isValid = await checkAuthentication()
        if (!isValid) {
          setIsChecking(true)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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
