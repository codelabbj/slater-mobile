import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.slaterci.net"
console.log('API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url)

  // Skip adding auth token for authentication endpoints
  // Check both relative paths and full URLs
  const authEndpoints = ['auth/login', 'auth/register', 'auth/refresh']
  const fullUrl = config.url || ''
  const isAuthEndpoint = authEndpoints.some(endpoint =>
    fullUrl.includes(endpoint) || fullUrl.includes(`/${endpoint}`)
  )

  if (!isAuthEndpoint && typeof window !== "undefined") {
    try {
      const { getAccessToken } = await import('./auth')
      const token = await getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Added auth token to request')
      } else {
        console.log('No auth token available for request')
      }
    } catch (error) {
      console.error('Error getting access token for request:', error)
    }
  } else if (isAuthEndpoint) {
    console.log('Skipping auth token for auth endpoint:', config.url)
    // Explicitly remove any existing authorization header
    delete config.headers.Authorization
  }

  return config
})

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (res) => {
    console.log('API Response:', res.status, res.config.method?.toUpperCase(), res.config.url)
    return res
  },
  async (error) => {
    console.log('API Error:', error.response?.status, error.config?.method?.toUpperCase(), error.config?.url, error.message)
    const original = error.config

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !original._retry) {
      console.log('Got 401 error, attempting token refresh...')
      original._retry = true

      if (typeof window !== "undefined") {
        try {
          const { PersistentStorage } = await import('./storage')
          const refresh = await PersistentStorage.get("refresh_token")
          console.log('Refresh token available:', !!refresh)
          if (!refresh) {
            throw new Error("No refresh token")
          }

          console.log('Making refresh request...')
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://api.slaterci.net"
          const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
          const res = await axios.post(
            `${normalizedBaseUrl}auth/refresh`,
            { refresh },
            {
              headers: {
                'Content-Type': 'application/json',
                // Explicitly no Authorization header for refresh requests
              }
            }
          )

          const newToken = res.data.access
          console.log('Refresh successful, new token received')
          await PersistentStorage.set("access_token", newToken)
          original.headers.Authorization = `Bearer ${newToken}`

          return api(original)
        } catch (refreshError: any) {
          console.log('Refresh failed:', refreshError.message || refreshError)
          // Clear tokens and redirect to login
          const { PersistentStorage } = await import('./storage')
          await PersistentStorage.clear()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          return Promise.reject(refreshError)
        }
      }
    }

    // Handle specific HTTP status codes with default French messages
    let errorMessage = ""

    if (error.response?.status === 404) {
      errorMessage = "Ressource non trouvée. Veuillez vérifier l'URL ou contacter le support."
    } else if (error.response?.status >= 500) {
      errorMessage = "Erreur du serveur. Veuillez réessayer plus tard ou contacter le support."
    } else if (!error.response) {
      // Network error or no response
      errorMessage = "Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer."
    } else {
      // For other status codes, try to extract message from backend response
      errorMessage =
        error.response?.data?.details ||
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : "Une erreur est survenue. Veuillez réessayer.")
    }

    return Promise.reject({ message: errorMessage, originalError: error })
  },
)

export default api
