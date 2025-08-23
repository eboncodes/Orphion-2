export interface APIKeys {
  gemini: string
}

export function getAPIKeys(): APIKeys {
  return {
    // Prefer public key in client bundles; fall back to server env
    gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  }
}

export function isAPISetupComplete(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY)
}

export function clearAPIKeys(): void {
  // No longer needed with hardcoded keys
}

export function getAPIKey(service: keyof APIKeys): string {
  const keys = getAPIKeys()
  return keys[service] || ''
} 