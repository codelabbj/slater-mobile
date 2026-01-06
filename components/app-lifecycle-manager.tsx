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
    let isValidatingAuth = false // Prevent multiple simultaneous validations

    const setupListener = async () => {
      // Listen for app resume events
      resumeListener = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          // App came back to foreground
          console.log('App resumed from background')

          // Prevent multiple simultaneous auth validations
          if (isValidatingAuth) {
            console.log('Auth validation already in progress, skipping...')
            return
          }

          isValidatingAuth = true

          try {
            // Small delay to ensure storage plugins are ready after app resume
            await new Promise(resolve => setTimeout(resolve, 500))

            // Re-validate and refresh token if needed when app resumes
            console.log('Starting authentication validation on app resume...')
            const tokenValid = await ensureValidToken()

            if (!tokenValid) {
              console.log('Authentication validation failed on app resume')

              // Double-check by trying to get tokens directly
              const { PersistentStorage } = await import('@/lib/storage')
              const accessToken = await PersistentStorage.get('access_token')
              const refreshToken = await PersistentStorage.get('refresh_token')

              console.log('Token status on resume - access:', !!accessToken, 'refresh:', !!refreshToken)

              // Only redirect if we truly have no tokens at all
              if (!accessToken && !refreshToken) {
                console.log('No tokens found, redirecting to login')
                if (typeof window !== 'undefined') {
                  window.location.href = '/login'
                }
              } else {
                console.log('Tokens exist but validation failed, staying logged in')
              }
            } else {
              console.log('Authentication validated and token refreshed on app resume')
            }
          } catch (error) {
            console.error('Error validating authentication on app resume:', error)

            // Don't redirect on errors, just log them
            console.log('Auth validation error, but not redirecting to avoid false logouts')
          } finally {
            isValidatingAuth = false
          }
        } else {
          // App went to background
          console.log('App went to background')
          isValidatingAuth = false // Reset flag when going to background
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
