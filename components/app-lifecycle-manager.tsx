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

    // Function to wait for Capacitor plugins to be ready
    const waitForPlugins = async (maxRetries = 15): Promise<void> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          // Try to access Capacitor Preferences directly to check if it's ready
          const { Preferences } = await import('@capacitor/preferences')
          await Preferences.get({ key: 'capacitor_test' })
          console.log('Capacitor plugins ready after', i + 1, 'attempts')
          return
        } catch (error) {
          console.log('Waiting for Capacitor plugins to be ready...', i + 1, '/', maxRetries)
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      console.warn('Capacitor plugins may not be fully ready, proceeding anyway')
    }

    // Enhanced token validation with retry logic
    const validateAuthWithRetry = async (maxRetries = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Auth validation attempt ${attempt}/${maxRetries}`)
          const tokenValid = await ensureValidToken()

          if (tokenValid) {
            console.log('Authentication validation successful')
            return true
          }

          // If validation failed, check if tokens actually exist
          const { PersistentStorage } = await import('@/lib/storage')
          const accessToken = await PersistentStorage.get('access_token')
          const refreshToken = await PersistentStorage.get('refresh_token')

          console.log('Token status - access:', !!accessToken, 'refresh:', !!refreshToken)

          // If we have refresh token, try to use it directly
          if (refreshToken && !accessToken) {
            console.log('Have refresh token but no access token, attempting direct refresh...')
            const { refreshAccessToken } = await import('@/lib/auth')
            const newToken = await refreshAccessToken()
            if (newToken) {
              console.log('Direct refresh successful')
              return true
            }
          }

          // Only consider it a failure if we have no tokens at all
          if (!accessToken && !refreshToken) {
            console.log('No tokens found at all')
            return false
          }

          // If we have tokens but validation failed, wait and retry
          if (attempt < maxRetries) {
            console.log(`Validation failed but tokens exist, waiting before retry...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (error) {
          console.error(`Auth validation attempt ${attempt} failed:`, error)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      console.log('All auth validation attempts failed')
      return false
    }

    // Validate authentication on app startup
    const validateAuthOnStartup = async () => {
      try {
        console.log('Validating authentication on app startup...')
        await waitForPlugins()

        const tokenValid = await validateAuthWithRetry(1) // Single attempt on startup

        if (!tokenValid) {
          // Double-check tokens exist
          const { PersistentStorage } = await import('@/lib/storage')
          const accessToken = await PersistentStorage.get('access_token')
          const refreshToken = await PersistentStorage.get('refresh_token')

          if (!accessToken && !refreshToken) {
            console.log('No tokens found on startup, redirecting to login')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          } else {
            console.log('Tokens exist on startup but validation failed, proceeding anyway')
          }
        } else {
          console.log('Authentication validated on app startup')
        }
      } catch (error) {
        console.error('Error validating auth on startup:', error)
        // Don't redirect on startup errors to avoid blocking app launch
      }
    }

    const setupListener = async () => {
      // First validate authentication on app startup
      await validateAuthOnStartup()

      // Then listen for app resume events
      resumeListener = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          // App came back to foreground
          console.log('App resumed from background (Capacitor)')

          // Prevent multiple simultaneous auth validations
          if (isValidatingAuth) {
            console.log('Auth validation already in progress, skipping...')
            return
          }

          isValidatingAuth = true

          try {
            // Wait for Capacitor plugins to be ready
            await waitForPlugins()

            // Additional delay for storage stability
            await new Promise(resolve => setTimeout(resolve, 300))

            // Re-validate and refresh token if needed when app resumes
            console.log('Starting authentication validation on app resume...')
            const tokenValid = await validateAuthWithRetry()

            if (!tokenValid) {
              console.log('Authentication validation failed on app resume, redirecting to login')
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
            } else {
              console.log('Authentication validated and token refreshed on app resume')
            }
          } catch (error) {
            console.error('Error validating authentication on app resume:', error)

            // On critical errors, still redirect to be safe
            console.log('Critical auth validation error, redirecting to login for safety')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
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
