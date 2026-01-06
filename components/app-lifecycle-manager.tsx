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
      // Listen for app resume events - no authentication checks needed
      resumeListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // App came back to foreground
          console.log('App resumed from background')
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
