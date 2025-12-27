// Simple in-memory blacklist for reported bad events
// In production, this would be persisted to a database

export class EventBlacklistService {
  private blacklistedEventIds: Set<string> = new Set();
  private blacklistedEventNames: Set<string> = new Set();

  reportEvent(eventId: string, eventName: string, reason?: string): void {
    this.blacklistedEventIds.add(eventId);
    this.blacklistedEventNames.add(eventName.toLowerCase());
    console.log(`🚫 Event blacklisted: "${eventName}" (ID: ${eventId}) - Reason: ${reason || 'Not specified'}`);
  }

  isBlacklisted(eventId: string, eventName: string): boolean {
    if (this.blacklistedEventIds.has(eventId)) return true;
    if (this.blacklistedEventNames.has(eventName.toLowerCase())) return true;
    return false;
  }

  getBlacklistedCount(): number {
    return this.blacklistedEventIds.size;
  }

  clearBlacklist(): void {
    this.blacklistedEventIds.clear();
    this.blacklistedEventNames.clear();
    console.log('🔄 Event blacklist cleared');
  }
}

