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
  try {
    const token = await getAccessToken()
    console.log('ensureValidToken: access token exists:', !!token)

    if (!token) {
      console.log('ensureValidToken: no access token found')
      return false
    }

    // If token is expired, try to refresh it
    const isExpired = isTokenExpired(token)
    console.log('ensureValidToken: token expired:', isExpired)

    if (isExpired) {
      console.log('ensureValidToken: attempting token refresh...')
      const newToken = await refreshAccessToken()
      const refreshSuccess = !!newToken
      console.log('ensureValidToken: token refresh success:', refreshSuccess)
      return refreshSuccess
    }

    // Check if token will expire soon (within 5 minutes) and refresh proactively
    try {
      const decoded = decodeJWT(token)
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = decoded.exp - currentTime
        console.log('ensureValidToken: token expires in', timeUntilExpiry, 'seconds')

        // If token expires within 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          console.log('ensureValidToken: token expires soon, refreshing proactively...')
          const newToken = await refreshAccessToken()
          const proactiveRefreshSuccess = !!newToken
          console.log('ensureValidToken: proactive refresh success:', proactiveRefreshSuccess)
          return proactiveRefreshSuccess
        }
      } else {
        console.log('ensureValidToken: could not decode token or no exp field')
      }
    } catch (error) {
      console.error('ensureValidToken: error checking token expiry time:', error)
      // Don't fail validation just because we can't check expiry
    }

    console.log('ensureValidToken: token is valid')
    return true
  } catch (error) {
    console.error('ensureValidToken: unexpected error:', error)
    // On unexpected errors, assume token is invalid for safety
    return false
  }
}

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await PersistentStorage.get("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://api.slaterci.net"}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data = await response.json()
    const newAccessToken = data.access

    // Save the new access token
    await PersistentStorage.set("access_token", newAccessToken)

    console.log('Access token refreshed successfully')
    return newAccessToken
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return null
  }
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
