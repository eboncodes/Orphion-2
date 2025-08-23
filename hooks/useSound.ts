import { useSettings } from "@/contexts/SettingsContext"

export function useSound() {
  const { settings } = useSettings()

  const playSound = (soundType: 'success' | 'error' | 'click' | 'notification') => {
    if (!settings.soundEnabled) return

    // Create audio context for better control
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Generate different sounds based on type
    let frequency = 800
    let duration = 0.1
    
    switch (soundType) {
      case 'success':
        frequency = 1000
        duration = 0.2
        break
      case 'error':
        frequency = 400
        duration = 0.3
        break
      case 'click':
        frequency = 600
        duration = 0.05
        break
      case 'notification':
        frequency = 1200
        duration = 0.15
        break
    }

    // Create oscillator
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Set frequency and type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = 'sine'
    
    // Set volume based on settings
    const volume = settings.soundVolume / 100
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    
    // Start and stop
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }

  return { playSound }
}
