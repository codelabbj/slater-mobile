"use client"

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { ensureValidToken } from '@/lib/auth'

export function AppLifecycleManager() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return // Only run on native platforms
    }

    let resumeListener: any = null

    const setupListener = async () => {
      // Listen for app resume events
      resumeListener = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          // App came back to foreground
          console.log('App resumed from background')

          try {
            // Re-validate and refresh token if needed when app resumes
            const tokenValid = await ensureValidToken()

            if (!tokenValid) {
              // User is not authenticated or token refresh failed, redirect to login
              console.log('Authentication validation failed on app resume, redirecting to login')
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            } else {
              console.log('Authentication validated and token refreshed on app resume')
            }
          } catch (error) {
            console.error('Error validating authentication on app resume:', error)
            // On error, redirect to login for safety
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          }
        } else {
          // App went to background
          console.log('App went to background')
        }
      })
    }

    setupListener()

    // Cleanup listener on unmount
    return () => {
      if (resumeListener) {
        resumeListener.remove()
      }
    }
  }, [])

  return null // This component doesn't render anything
}
