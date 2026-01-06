import { PersistentStorage } from './storage'

// JWT token utilities
function decodeJWT(token: string): any | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token)
    if (!decoded || !decoded.exp) {
      return true // Consider invalid tokens as expired
    }

    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  bonus_available: number
  referral_code: string
  username?: string
  is_superuser?: boolean
  is_delete?: boolean
  otp?: string | null
  otp_created_at?: string
  is_block?: boolean
  referrer_code?: string | null
  is_active?: boolean
  is_staff?: boolean
  is_supperuser?: boolean
  date_joined?: string
  last_login?: string
}

export interface AuthResponse {
  refresh: string
  access: string
  exp: string
  data: User
}

export const saveAuthData = async (authData: AuthResponse) => {
  try {
    await PersistentStorage.set("access_token", authData.access)
    await PersistentStorage.set("refresh_token", authData.refresh)
    await PersistentStorage.set("user", JSON.stringify(authData.data))
  } catch (error) {
    console.error('Error saving auth data:', error)
  }
}

export const getUser = async (): Promise<User | null> => {
  try {
    const userStr = await PersistentStorage.get("user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  } catch (error) {
    console.error('Error getting user:', error)
  }
  return null
}

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await PersistentStorage.get("access_token")
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken()
  if (!token) {
    return false
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.log('Access token is expired')
    return false
  }

  return true
}

export const ensureValidToken = async (): Promise<boolean> => {
  const token = await getAccessToken()
  return !!token // Simply check if token exists
}

export const refreshAccessToken = async (): Promise<string | null> => {
  const { Capacitor } = await import('@capacitor/core')

  try {
    const refreshToken = await PersistentStorage.get("refresh_token")
    if (!refreshToken) {
      console.log('refreshAccessToken: No refresh token available')
      return null
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://api.slaterci.net"
    const refreshUrl = `${baseUrl}/auth/refresh`

    console.log('refreshAccessToken: Attempting to refresh token...')

    // On mobile, add timeout and retry logic
    let attempts = 0
    const maxAttempts = Capacitor.isNativePlatform() ? 2 : 1

    while (attempts < maxAttempts) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        const newAccessToken = data.access

        if (!newAccessToken) {
          throw new Error('No access token in refresh response')
        }

        // Save the new access token
        await PersistentStorage.set("access_token", newAccessToken)

        console.log('refreshAccessToken: Access token refreshed successfully')
        return newAccessToken

      } catch (fetchError) {
        attempts++
        console.warn(`refreshAccessToken: Attempt ${attempts} failed:`, fetchError)

        if (attempts < maxAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          // All attempts failed
          throw fetchError
        }
      }
    }

  } catch (error) {
    console.error('refreshAccessToken: Error refreshing access token:', error)
    return null
  }

  return null
}

export const logout = async () => {
  try {
    await PersistentStorage.clear()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  } catch (error) {
    console.error('Error during logout:', error)
    // Fallback
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }
}
