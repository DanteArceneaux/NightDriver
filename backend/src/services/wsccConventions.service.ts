// import axios from 'axios'; // TODO: Use for actual web scraping

export interface Convention {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  expectedAttendance?: number;
  category?: string;
  description?: string;
}

export interface ConventionImpact {
  convention: Convention;
  impactedZones: Array<{
    zoneId: string;
    boost: number;
    reason: string;
  }>;
}

/**
 * Real WSCC (Washington State Convention Center) scraper
 * Falls back to curated calendar if scraping fails
 */
export class WSCCConventionsService {
  private conventions: Convention[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get all conventions (from cache or fresh fetch)
   */
  async getConventions(): Promise<Convention[]> {
    if (this.shouldRefresh()) {
      await this.fetchConventions();
    }
    return this.conventions;
  }

  /**
   * Get active conventions for a specific date
   */
  async getActiveConventions(date: Date = new Date()): Promise<Convention[]> {
    const all = await this.getConventions();
    return all.filter(conv => {
      const start = new Date(conv.startDate);
      const end = new Date(conv.endDate);
      return date >= start && date <= end;
    });
  }

  /**
   * Calculate zone impact for active conventions
   */
  async getConventionImpacts(date: Date = new Date()): Promise<ConventionImpact[]> {
    const active = await this.getActiveConventions(date);
    
    return active.map(convention => ({
      convention,
      impactedZones: this.calculateImpactedZones(convention, date),
    }));
  }

  private shouldRefresh(): boolean {
    if (!this.lastFetch) return true;
    const elapsed = Date.now() - this.lastFetch.getTime();
    return elapsed > this.CACHE_DURATION_MS;
  }

  /**
   * Fetch conventions from WSCC or fallback to curated list
   */
  private async fetchConventions(): Promise<void> {
    try {
      // Try to scrape WSCC website
      const scraped = await this.scrapeWSCC();
      if (scraped.length > 0) {
        this.conventions = scraped;
        this.lastFetch = new Date();
        console.log(`✅ Fetched ${scraped.length} conventions from WSCC`);
        return;
      }
    } catch (error) {
      console.warn('⚠️ WSCC scraping failed, using curated calendar:', error);
    }

    // Fallback to curated list
    this.conventions = this.getCuratedConventions();
    this.lastFetch = new Date();
  }

  /**
   * Scrape WSCC public events calendar
   */
  private async scrapeWSCC(): Promise<Convention[]> {
    // WSCC events are listed at visitseattle.org/partners/washington-state-convention-center/
    // For now, return empty array - actual scraping would need Puppeteer or Cheerio
    // and proper HTML parsing logic specific to their page structure
    
    // TODO: Implement actual scraping when we add Puppeteer dependency
    // For now, fall back to curated list
    return [];
  }

  /**
   * Curated convention calendar (fallback + seed data)
   */
  private getCuratedConventions(): Convention[] {
    const now = new Date();
    const thisYear = now.getFullYear();
    const nextYear = thisYear + 1;

    return [
      // Real Seattle conventions that repeat annually
      {
        id: 'pax-west',
        name: 'PAX West',
        startDate: new Date(thisYear, 8, 1).toISOString(), // Sept 1
        endDate: new Date(thisYear, 8, 4).toISOString(),   // Sept 4
        venue: 'Washington State Convention Center',
        expectedAttendance: 70000,
        category: 'Gaming',
        description: 'Major gaming convention with huge rideshare demand',
      },
      {
        id: 'emerald-city-comic-con',
        name: 'Emerald City Comic Con',
        startDate: new Date(nextYear, 2, 1).toISOString(), // March 1
        endDate: new Date(nextYear, 2, 3).toISOString(),   // March 3
        venue: 'Washington State Convention Center',
        expectedAttendance: 90000,
        category: 'Entertainment',
        description: 'Large pop culture convention',
      },
      {
        id: 'seattle-auto-show',
        name: 'Seattle International Auto Show',
        startDate: new Date(thisYear, 10, 10).toISOString(), // Nov 10
        endDate: new Date(thisYear, 10, 13).toISOString(),   // Nov 13
        venue: 'Lumen Field Event Center',
        expectedAttendance: 150000,
        category: 'Auto',
        description: 'Major auto show with high attendance',
      },
      {
        id: 'seafair',
        name: 'Seafair',
        startDate: new Date(thisYear, 7, 1).toISOString(), // August
        endDate: new Date(thisYear, 7, 6).toISOString(),
        venue: 'Various Locations',
        expectedAttendance: 500000,
        category: 'Festival',
        description: 'Major Seattle festival with events citywide',
      },
    ];
  }

  /**
   * Calculate which zones are impacted by a convention
   */
  private calculateImpactedZones(convention: Convention, currentTime: Date): Array<{
    zoneId: string;
    boost: number;
    reason: string;
  }> {
    const zones: Array<{ zoneId: string; boost: number; reason: string }> = [];
    const hour = currentTime.getHours();
    const convStart = new Date(convention.startDate);
    const convEnd = new Date(convention.endDate);
    const isActiveNow = currentTime >= convStart && currentTime <= convEnd;

    if (!isActiveNow) return zones;

    const size = convention.expectedAttendance || 5000;
    const sizeMultiplier = Math.min(size / 10000, 3); // Cap at 3x

    // Convention center itself
    zones.push({
      zoneId: 'convention_center',
      boost: Math.round(20 * sizeMultiplier),
      reason: `${convention.name} in progress`,
    });

    // Morning arrival surge (7am-10am)
    if (hour >= 7 && hour <= 10) {
      zones.push({
        zoneId: 'downtown_hotel_row_union',
        boost: Math.round(15 * sizeMultiplier),
        reason: 'Convention attendees heading to venue',
      });
      zones.push({
        zoneId: 'seatac',
        boost: Math.round(12 * sizeMultiplier),
        reason: 'Out-of-town attendees arriving',
      });
    }

    // Lunch surge (11am-1pm)
    if (hour >= 11 && hour <= 13) {
      zones.push({
        zoneId: 'pike_place_market',
        boost: Math.round(10 * sizeMultiplier),
        reason: 'Convention lunch break',
      });
      zones.push({
        zoneId: 'retail_core',
        boost: Math.round(8 * sizeMultiplier),
        reason: 'Convention attendees shopping',
      });
    }

    // Evening departure surge (4pm-7pm)
    if (hour >= 16 && hour <= 19) {
      zones.push({
        zoneId: 'downtown_hotel_row_union',
        boost: Math.round(12 * sizeMultiplier),
        reason: 'Convention attendees returning to hotels',
      });
      zones.push({
        zoneId: 'capitol_hill_pine_pike',
        boost: Math.round(10 * sizeMultiplier),
        reason: 'Convention attendees going to dinner',
      });
      zones.push({
        zoneId: 'seatac',
        boost: Math.round(10 * sizeMultiplier),
        reason: 'Attendees heading to airport',
      });
    }

    return zones;
  }

  /**
   * Manually add a convention (for testing or user-reported events)
   */
  addConvention(convention: Convention): void {
    this.conventions.push(convention);
  }

  /**
   * Clear cache and force refresh
   */
  clearCache(): void {
    this.conventions = [];
    this.lastFetch = null;
  }
}

