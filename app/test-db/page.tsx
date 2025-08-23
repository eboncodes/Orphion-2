"use client"

import { useEffect, useState } from 'react'
import { AuthService } from '@/lib/auth-service'

export default function TestDBPage() {
  const [testResult, setTestResult] = useState<string>('Testing...')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const runTests = async () => {
      try {
        // Test profiles table
        const tableAccessible = await AuthService.testProfilesTable()
        
        // Get current user
        const user = await AuthService.getCurrentUser()
        setCurrentUser(user)
        
        if (tableAccessible) {
          setTestResult('✅ Profiles table is accessible')
        } else {
          setTestResult('❌ Profiles table is not accessible')
        }
      } catch (error) {
        setTestResult(`❌ Test failed: ${error}`)
      }
    }

    runTests()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Profiles Table Test:</h2>
          <p className="text-sm text-gray-600">{testResult}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Current User:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(currentUser, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
