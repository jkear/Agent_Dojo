import axios from 'axios'
import { credentialService, ApiKeyType } from '../services/credentials'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth and API keys
api.interceptors.request.use(async (config) => {
  // Add auth token if available
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Add OpenAI API key from secure storage if available
  // This allows the frontend to pass the user's API key to the backend
  try {
    await credentialService.initialize()
    const openaiKey = await credentialService.getApiKey(ApiKeyType.OPENAI)
    if (openaiKey) {
      config.headers['X-OpenAI-API-Key'] = openaiKey
    }
    
    const composioKey = await credentialService.getApiKey(ApiKeyType.COMPOSIO)
    if (composioKey) {
      config.headers['X-Composio-API-Key'] = composioKey
    }
  } catch (error) {
    console.error('Failed to retrieve API keys:', error)
    // Continue with the request even if we can't get API keys
  }
  
  // Add trailing slash to prevent 307 redirects
  if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
    config.url = config.url + '/'
  }
  
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)