import axios from 'axios';

/**
 * ESPN Unofficial API Service - FREE, no API key required!
 * Provides real-time game status for Seattle sports teams.
 * 
 * Use cases:
 * - Know when games are in final period → position for surge
 * - Get actual end times once games finish
 * - Pre-surge alerts: "Seahawks in 4th quarter - head to Lumen Field NOW"
 */

export interface LiveGame {
  id: string;
  name: string;
  shortName: string;
  venue: string;
  startTime: string;
  status: 'scheduled' | 'in_progress' | 'halftime' | 'delayed' | 'final' | 'postponed';
  period: string; // "1st Quarter", "3rd Period", "7th Inning", etc.
  clock: string; // "12:34" remaining in period
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isSeattleTeam: boolean;
  estimatedEndTime: string;
  actualEndTime?: string;
  nearingEnd: boolean; // True if in final period/quarter
  surgeAlert?: string; // Alert message for drivers
}

interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
    };
    period: number;
    displayClock: string;
  };
  competitions: Array<{
    venue?: { fullName: string };
    competitors: Array<{
      homeAway: string;
      team: { displayName: string; abbreviation: string };
      score: string;
    }>;
  }>;
}

// Seattle team identifiers
const SEATTLE_TEAMS = [
  'seahawks', 'seattle seahawks',
  'mariners', 'seattle mariners',
  'kraken', 'seattle kraken',
  'sounders', 'seattle sounders',
  'storm', 'seattle storm',
  'huskies', 'washington huskies', 'uw',
  'cougars', 'washington state', 'wsu',
];

// League configurations
const LEAGUES = {
  nfl: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    periodName: 'Quarter',
    totalPeriods: 4,
    periodMinutes: 15,
    halfTime: true,
    avgGameMinutes: 195, // ~3h 15m
  },
  mlb: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    periodName: 'Inning',
    totalPeriods: 9,
    periodMinutes: 20,
    halfTime: false,
    avgGameMinutes: 180, // ~3h
  },
  nhl: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    periodName: 'Period',
    totalPeriods: 3,
    periodMinutes: 20,
    halfTime: false,
    avgGameMinutes: 165, // ~2h 45m
  },
  mls: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
    periodName: 'Half',
    totalPeriods: 2,
    periodMinutes: 45,
    halfTime: true,
    avgGameMinutes: 135, // ~2h 15m
  },
  wnba: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    periodName: 'Quarter',
    totalPeriods: 4,
    periodMinutes: 10,
    halfTime: true,
    avgGameMinutes: 120, // ~2h
  },
  ncaaf: {
    url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    periodName: 'Quarter',
    totalPeriods: 4,
    periodMinutes: 15,
    halfTime: true,
    avgGameMinutes: 210, // ~3h 30m
  },
};

export class ESPNService {
  private cache: Map<string, { data: LiveGame[]; timestamp: number }> = new Map();
  private cacheTTL = 60000; // 1 minute cache

  /**
   * Get all live/upcoming Seattle-area games
   */
  async getSeattleGames(): Promise<LiveGame[]> {
    const allGames: LiveGame[] = [];

    // Fetch from all leagues in parallel
    const results = await Promise.allSettled(
      Object.entries(LEAGUES).map(([league, config]) => 
        this.fetchLeagueGames(league, config)
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allGames.push(...result.value);
      }
    }

    // Sort by start time
    return allGames.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Get games that are nearing their end (final period)
   * These are prime surge opportunities!
   */
  async getEndingSoonGames(): Promise<LiveGame[]> {
    const games = await this.getSeattleGames();
    return games.filter(g => g.nearingEnd && g.status === 'in_progress');
  }

  /**
   * Get surge alerts for games ending soon
   */
  async getSurgeAlerts(): Promise<string[]> {
    const endingGames = await this.getEndingSoonGames();
    return endingGames
      .filter(g => g.surgeAlert)
      .map(g => g.surgeAlert!);
  }

  private async fetchLeagueGames(
    league: string, 
    config: typeof LEAGUES[keyof typeof LEAGUES]
  ): Promise<LiveGame[]> {
    // Check cache
    const cached = this.cache.get(league);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await axios.get(config.url, { timeout: 5000 });
      const events = response.data.events || [];
      
      const games = events
        .map((event: ESPNGame) => this.mapToLiveGame(event, league, config))
        .filter((g: LiveGame | null): g is LiveGame => g !== null);

      // Cache results
      this.cache.set(league, { data: games, timestamp: Date.now() });
      
      return games;
    } catch (error: any) {
      console.error(`ESPN ${league} fetch error:`, error.message);
      return cached?.data || [];
    }
  }

  private mapToLiveGame(
    event: ESPNGame,
    _league: string,
    config: typeof LEAGUES[keyof typeof LEAGUES]
  ): LiveGame | null {
    try {
      const competition = event.competitions?.[0];
      if (!competition) return null;

      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
      if (!homeTeam || !awayTeam) return null;

      // Check if Seattle team is playing
      const isSeattleTeam = this.isSeattleTeam(homeTeam.team.displayName) || 
                           this.isSeattleTeam(awayTeam.team.displayName);

      // Only return Seattle games for non-national events
      // For major games, we might want all of them
      if (!isSeattleTeam) return null;

      const status = this.mapStatus(event.status);
      const period = event.status?.period || 0;
      const clock = event.status?.displayClock || '';
      
      const nearingEnd = this.isNearingEnd(status, period, clock, config);
      const estimatedEndTime = this.calculateEndTime(
        event.date, 
        status, 
        period, 
        clock, 
        config
      );

      const surgeAlert = nearingEnd ? this.generateSurgeAlert(
        homeTeam.team.displayName,
        awayTeam.team.displayName,
        competition.venue?.fullName || 'Unknown Venue',
        period,
        config.periodName,
        config.totalPeriods
      ) : undefined;

      return {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        venue: competition.venue?.fullName || 'Unknown Venue',
        startTime: event.date,
        status,
        period: `${this.ordinal(period)} ${config.periodName}`,
        clock,
        homeTeam: homeTeam.team.displayName,
        awayTeam: awayTeam.team.displayName,
        homeScore: parseInt(homeTeam.score) || 0,
        awayScore: parseInt(awayTeam.score) || 0,
        isSeattleTeam,
        estimatedEndTime,
        actualEndTime: status === 'final' ? new Date().toISOString() : undefined,
        nearingEnd,
        surgeAlert,
      };
    } catch (error) {
      console.error('Error mapping ESPN game:', error);
      return null;
    }
  }

  private isSeattleTeam(teamName: string): boolean {
    const lower = teamName.toLowerCase();
    return SEATTLE_TEAMS.some(t => lower.includes(t));
  }

  private mapStatus(status: ESPNGame['status']): LiveGame['status'] {
    const state = status?.type?.state?.toLowerCase() || '';
    const name = status?.type?.name?.toLowerCase() || '';

    if (status?.type?.completed) return 'final';
    if (state === 'pre') return 'scheduled';
    if (state === 'in' || state === 'live') {
      if (name.includes('halftime') || name.includes('intermission')) {
        return 'halftime';
      }
      return 'in_progress';
    }
    if (name.includes('delay')) return 'delayed';
    if (name.includes('postpone')) return 'postponed';
    
    return 'scheduled';
  }

  private isNearingEnd(
    status: LiveGame['status'],
    period: number,
    clock: string,
    config: typeof LEAGUES[keyof typeof LEAGUES]
  ): boolean {
    if (status !== 'in_progress') return false;

    // In final period
    if (period >= config.totalPeriods) {
      return true;
    }

    // In second-to-last period with less than 5 minutes
    if (period === config.totalPeriods - 1) {
      const minutes = this.parseClockMinutes(clock);
      if (minutes !== null && minutes < 5) {
        return true;
      }
    }

    return false;
  }

  private parseClockMinutes(clock: string): number | null {
    if (!clock) return null;
    const parts = clock.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) || 0;
    }
    return null;
  }

  private calculateEndTime(
    startTime: string,
    status: LiveGame['status'],
    period: number,
    clock: string,
    config: typeof LEAGUES[keyof typeof LEAGUES]
  ): string {
    const start = new Date(startTime);

    if (status === 'final') {
      // Game already ended
      return new Date().toISOString();
    }

    if (status === 'scheduled') {
      // Use average game duration
      return new Date(start.getTime() + config.avgGameMinutes * 60 * 1000).toISOString();
    }

    // For in-progress games, estimate remaining time
    const periodsRemaining = Math.max(0, config.totalPeriods - period);
    const clockMinutes = this.parseClockMinutes(clock) || config.periodMinutes;
    
    // Remaining time = current period remaining + full periods remaining
    const remainingMinutes = clockMinutes + (periodsRemaining * config.periodMinutes);
    
    // Add buffer for stoppages, timeouts, etc. (~50% more time for real games)
    const realRemainingMinutes = remainingMinutes * 1.5;
    
    return new Date(Date.now() + realRemainingMinutes * 60 * 1000).toISOString();
  }

  private generateSurgeAlert(
    homeTeam: string,
    awayTeam: string,
    venue: string,
    period: number,
    periodName: string,
    totalPeriods: number
  ): string {
    const isFinal = period >= totalPeriods;
    const timeframe = isFinal ? '15-20 minutes' : '30-45 minutes';
    
    // Determine zone based on venue
    let zone = 'the area';
    if (venue.toLowerCase().includes('lumen')) zone = 'SoDo district';
    else if (venue.toLowerCase().includes('t-mobile')) zone = 'SoDo district';
    else if (venue.toLowerCase().includes('climate pledge')) zone = 'Seattle Center';
    else if (venue.toLowerCase().includes('husky')) zone = 'U-District';

    return `🏟️ ${homeTeam} vs ${awayTeam} in ${this.ordinal(period)} ${periodName}! ` +
           `Head to ${zone} - surge expected in ${timeframe}`;
  }

  private ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

