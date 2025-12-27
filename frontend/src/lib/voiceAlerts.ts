// Voice alert system using Web Speech API

class VoiceAlertService {
  private synth: SpeechSynthesis | null = null;
  private enabled: boolean = false;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.cancel();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  speak(text: string, priority: 'low' | 'normal' | 'high' = 'normal'): void {
    if (!this.enabled || !this.synth) {
      return;
    }

    // Cancel low-priority alerts if a higher priority one comes in
    if (priority === 'high' && this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice parameters
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Use a clear, professional voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  // Predefined alert messages
  alertSurge(zoneName: string, score: number): void {
    this.speak(
      `Surge alert! ${zoneName} is now at ${score} points. Consider moving there.`,
      'high'
    );
  }

  alertMoveRecommendation(zoneName: string, distance: number, driveTime: number): void {
    this.speak(
      `Incoming surge in ${zoneName}, ${distance.toFixed(1)} miles away. ${driveTime} minutes drive time. Move now?`,
      'high'
    );
  }

  alertEventEnding(eventName: string, zoneName: string, minutes: number): void {
    this.speak(
      `${eventName} ending in ${minutes} minutes at ${zoneName}. Pickup surge expected.`,
      'normal'
    );
  }

  alertShiftStart(): void {
    this.speak('Shift started. Good luck out there!', 'normal');
  }

  alertShiftEnd(earnings: number, duration: number): void {
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    this.speak(
      `Shift ended. You earned an estimated $${earnings.toFixed(0)} in ${hours} hours and ${mins} minutes.`,
      'normal'
    );
  }

  alertHighDemandZone(zoneName: string): void {
    this.speak(
      `You are entering ${zoneName}, a high demand zone.`,
      'low'
    );
  }
}

export const voiceAlerts = new VoiceAlertService();

