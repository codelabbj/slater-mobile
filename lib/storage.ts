import { Preferences } from '@capacitor/preferences'

export class PersistentStorage {
  /**
   * Set a value in persistent storage
   */
  static async set(key: string, value: string): Promise<void> {
    const { Capacitor } = await import('@capacitor/core')

    if (Capacitor.isNativePlatform()) {
      // On native platforms, use Capacitor Preferences with retry
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          await Preferences.set({ key, value })
          return
        } catch (error) {
          attempts++
          console.warn(`Preferences.set attempt ${attempts} failed:`, error)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }

      // If all Capacitor attempts fail, throw error
      throw new Error(`Failed to set ${key} in Capacitor Preferences after ${maxAttempts} attempts`)
    } else {
      // On web, use localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    }
  }

  /**
   * Get a value from persistent storage
   */
  static async get(key: string): Promise<string | null> {
    const { Capacitor } = await import('@capacitor/core')

    if (Capacitor.isNativePlatform()) {
      // On native platforms, use Capacitor Preferences with retry
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          const result = await Preferences.get({ key })
          return result.value || null
        } catch (error) {
          attempts++
          console.warn(`Preferences.get attempt ${attempts} failed:`, error)
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }

      // If all Capacitor attempts fail, return null
      console.warn(`Failed to get ${key} from Capacitor Preferences after ${maxAttempts} attempts`)
      return null
    } else {
      // On web, use localStorage
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key)
      }
      return null
    }
  }

  /**
   * Remove a value from persistent storage
   */
  static async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key })
    } catch (error) {
      console.error('Error removing persistent storage:', error)
      // Fallback to localStorage for web development
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    }
  }

  /**
   * Clear all values from persistent storage
   */
  static async clear(): Promise<void> {
    try {
      await Preferences.clear()
    } catch (error) {
      console.error('Error clearing persistent storage:', error)
      // Fallback to localStorage for web development
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    }
  }

  /**
   * Get all keys from persistent storage
   */
  static async keys(): Promise<string[]> {
    try {
      const result = await Preferences.keys()
      return result.keys
    } catch (error) {
      console.error('Error getting storage keys:', error)
      // Fallback to localStorage for web development
      if (typeof window !== 'undefined') {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) keys.push(key)
        }
        return keys
      }
      return []
    }
  }
}
