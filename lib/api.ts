import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.slaterci.net"
console.log('API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  // Only log in development or for specific errors
  // console.log('API Request:', config.method?.toUpperCase(), config.url)

  // Skip adding auth token for authentication endpoints
  // Check both relative paths and full URLs
  const authEndpoints = ['auth/login', 'auth/register', 'auth/registration', 'auth/refresh', 'auth/send_otp', 'auth/reset_password']
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
      }
    } catch (error) {
      console.error('Error getting access token for request:', error)
    }
  } else if (isAuthEndpoint) {
    // Explicitly remove any existing authorization header
    delete config.headers.Authorization
  }

  return config
})

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (res) => {
    return res
  },
  async (error) => {
    const original = error.config

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('auth/login')) {
      original._retry = true

      if (typeof window !== "undefined") {
        try {
          const { refreshAccessToken } = await import('./auth')
          console.log('API Error: 401, attempting token refresh...')
          
          const newToken = await refreshAccessToken()
          
          if (!newToken) {
            throw new Error("Token refresh failed")
          }

          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshError: any) {
          console.error('Refresh failed after 401:', refreshError.message || refreshError)
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

    // Suppress errors for last-transaction or silent requests - avoid showing toast
    const isLastTransaction = original?.url?.includes("last-transaction")
    if (isLastTransaction || original?._silent) {
      return Promise.reject({ message: null, originalError: error, silent: true })
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
    } else if (error.response?.status === 401) {
      // Suppress 401 errors per user request - avoid showing toast
      return Promise.reject({ message: null, originalError: error, silent: true })
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
