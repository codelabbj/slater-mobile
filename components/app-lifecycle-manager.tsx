"use client"

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export function AppLifecycleManager() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return // Only run on native platforms
    }

    let resumeListener: any = null

    const setupListener = async () => {
      // Listen for app resume events - authentication is handled by API interceptor
      resumeListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // App came back to foreground
          console.log('App resumed from background')

          // Authentication is handled automatically by the API interceptor
          // when it encounters 401 errors and token refresh fails
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
