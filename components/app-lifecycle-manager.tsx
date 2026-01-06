"use client"

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { isAuthenticated } from '@/lib/auth'

export function AppLifecycleManager() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return // Only run on native platforms
    }

    // Listen for app resume events
    const resumeListener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // App came back to foreground
        console.log('App resumed from background')

        try {
          // Re-validate authentication when app resumes
          const authenticated = await isAuthenticated()

          if (!authenticated) {
            // User is not authenticated, redirect to login
            console.log('User not authenticated on app resume, redirecting to login')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          } else {
            console.log('User authentication validated on app resume')
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

    // Cleanup listener on unmount
    return () => {
      resumeListener.remove()
    }
  }, [])

  return null // This component doesn't render anything
}
