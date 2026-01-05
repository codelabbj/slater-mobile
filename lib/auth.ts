import { PersistentStorage } from './storage'

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
  return !!token
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
