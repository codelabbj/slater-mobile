import { Preferences } from '@capacitor/preferences'

export class PersistentStorage {
  /**
   * Set a value in persistent storage
   */
  static async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({
        key,
        value,
      })
    } catch (error) {
      console.error('Error setting persistent storage:', error)
      // Fallback to localStorage for web development
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    }
  }

  /**
   * Get a value from persistent storage
   */
  static async get(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key })
      return result.value || null
    } catch (error) {
      console.error('Error getting persistent storage:', error)
      // Fallback to localStorage for web development
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
