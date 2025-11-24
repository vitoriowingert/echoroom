/**
 * Sound service for playing notification sounds
 */
class SoundService {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Initialize audio context lazily (browsers require user interaction first)
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
  }

  /**
   * Set whether sounds are enabled
   */
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  /**
   * Play a notification sound
   */
  async playNotificationSound(): Promise<void> {
    if (!this.soundEnabled || !this.audioContext) {
      return;
    }

    try {
      // Create a simple beep sound using Web Audio API
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure the sound
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      // Set volume envelope (fade in/out) - increased duration
      const duration = 0.3; // Increased from 0.1 to 0.3 seconds
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);

      // Resume audio context if it's suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Play a message sent sound (different from notification)
   */
  async playMessageSentSound(): Promise<void> {
    if (!this.soundEnabled || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Shorter, higher-pitched sound for sent messages
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';

      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      oscillator.start(now);
      oscillator.stop(now + 0.05);

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Failed to play message sent sound:', error);
    }
  }
}

export const soundService = new SoundService();

