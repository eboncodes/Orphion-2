export interface APIKeys {
  gemini: string
}

export function getAPIKeys(): APIKeys {
  if (typeof window === 'undefined') {
    return {
      gemini: ''
    }
  }

  return {
    gemini: localStorage.getItem('gemini_api_key') || ''
  }
}

export function isAPISetupComplete(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  return localStorage.getItem('api_setup_complete') === 'true'
}

export function clearAPIKeys(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem('gemini_api_key')
  localStorage.removeItem('api_setup_complete')
}

export function getAPIKey(service: keyof APIKeys): string {
  if (typeof window === 'undefined') {
    return ''
  }
  
  return localStorage.getItem(`${service}_api_key`) || ''
} 