// import axios from 'axios'; // For future use with CruiseMapper API

/**
 * Cruise Ships Service
 * 
 * Seattle is a MAJOR cruise port (Pier 91 in Magnolia).
 * Each ship = 2000-4000 passengers = MASSIVE surge opportunity!
 * 
 * Ships dock morning (7-9am), depart evening (4-6pm).
 * Passengers need rides to/from airport, downtown hotels, etc.
 */

export interface CruiseShip {
  name: string;
  line: string; // e.g., "Norwegian", "Royal Caribbean"
  arrivalTime: string;
  departureTime: string;
  passengers: number;
  terminal: string; // Usually "Pier 91" or "Pier 66"
  status: 'scheduled' | 'docked' | 'departed';
}

export interface CruiseSurgeAlert {
  ship: CruiseShip;
  type: 'arrival' | 'departure';
  timeUntil: number; // minutes
  message: string;
  recommendedZone: string;
}

export class CruiseShipsService {
  private getTerminalZoneId(terminalName: string): string {
    switch (terminalName) {
      case 'Pier 91': return 'pier91_cruise_terminal';
      case 'Pier 66': return 'pier66_cruise_terminal';
      default: return ''; // Or throw an error, depending on desired behavior
    }
  }

  private getMinutesDifference(date1: Date, date2: Date): number {
    return (date1.getTime() - date2.getTime()) / (1000 * 60);
  }

  // Constants for cruise surge impact calculation
  private readonly ARRIVAL_SURGE_START_MIN = -30;  // 30 minutes before arrival
  private readonly ARRIVAL_SURGE_END_MIN = 120;    // 2 hours after arrival
  private readonly DEPARTURE_SURGE_START_MIN = -120; // 2 hours before departure
  private readonly DEPARTURE_SURGE_END_MIN = 30;   // 30 minutes after departure

  private readonly TERMINAL_IMPACT_ARRIVAL = 30;
  private readonly WATERFRONT_IMPACT_ARRIVAL = 18;
  private readonly SEATAC_IMPACT_ARRIVAL = 20;
  private readonly HOTELS_IMPACT_ARRIVAL = 15;

  private readonly TERMINAL_IMPACT_DEPARTURE = 25;
  private readonly HOTELS_IMPACT_DEPARTURE = 15;
  private readonly SEATAC_IMPACT_DEPARTURE = 10;

  // Typical cruise schedule for Seattle (April-October peak season)
  private getMockCruiseSchedule(): CruiseShip[] {
    const now = new Date();
    const ships: CruiseShip[] = [];

    // Check if it's cruise season (April-October)
    const month = now.getMonth();
    const isCruiseSeason = month >= 3 && month <= 9;

    if (!isCruiseSeason) {
      return [];
    }

    // Check day of week - most cruises are weekly (Sunday departures common)
    const dayOfWeek = now.getDay();
    
    // Sample ships for different days
    const schedules = [
      {
        days: [0, 3, 6], // Sunday, Wednesday, Saturday
        ship: {
          name: 'Norwegian Joy',
          line: 'Norwegian Cruise Line',
          passengers: 3800,
          terminal: 'Pier 91',
        },
      },
      {
        days: [1, 4], // Monday, Thursday
        ship: {
          name: 'Royal Caribbean Ovation',
          line: 'Royal Caribbean',
          passengers: 4180,
          terminal: 'Pier 91',
        },
      },
      {
        days: [2, 5], // Tuesday, Friday
        ship: {
          name: 'Celebrity Eclipse',
          line: 'Celebrity Cruises',
          passengers: 2850,
          terminal: 'Pier 66',
        },
      },
    ];

    for (const schedule of schedules) {
      if (schedule.days.includes(dayOfWeek)) {
        const arrivalTime = new Date(now);
        arrivalTime.setHours(8, 0, 0, 0);

        const departureTime = new Date(now);
        departureTime.setHours(17, 0, 0, 0);

        // Determine status
        let status: CruiseShip['status'] = 'scheduled';
        if (now >= arrivalTime && now < departureTime) {
          status = 'docked';
        } else if (now >= departureTime) {
          status = 'departed';
        }

        ships.push({
          name: schedule.ship.name,
          line: schedule.ship.line,
          arrivalTime: arrivalTime.toISOString(),
          departureTime: departureTime.toISOString(),
          passengers: schedule.ship.passengers,
          terminal: schedule.ship.terminal,
          status,
        });
      }
    }

    return ships;
  }

  /**
   * Get today's cruise ships
   */
  async getTodaysShips(): Promise<CruiseShip[]> {
    try {
      // In production, this would call CruiseMapper or Port of Seattle API
      // For now, using intelligent mock data based on real patterns
      return this.getMockCruiseSchedule();
    } catch (error) {
      console.error('Error fetching cruise ships:', error);
      return [];
    }
  }

  /**
   * Get surge alerts for upcoming arrivals/departures
   */
  async getSurgeAlerts(_alertWindowMinutes: number = 120): Promise<CruiseSurgeAlert[]> {
    const ships = await this.getTodaysShips();
    const now = new Date();
    const alerts: CruiseSurgeAlert[] = [];

    for (const ship of ships) {
      const arrival = new Date(ship.arrivalTime);
      const departure = new Date(ship.departureTime);

      // Check arrival surge (30 min before to 2 hours after)
      const minutesUntilArrival = this.getMinutesDifference(arrival, now);
      if (minutesUntilArrival >= this.ARRIVAL_SURGE_START_MIN && minutesUntilArrival <= this.DEPARTURE_SURGE_END_MIN) {
        const zone = this.getTerminalZoneId(ship.terminal);
        alerts.push({
          ship,
          type: 'arrival',
          timeUntil: Math.max(0, minutesUntilArrival),
          message: `🚢 ${ship.name} arriving at ${ship.terminal} with ${ship.passengers.toLocaleString()} passengers! Surge expected for airport/hotel rides.`,
          recommendedZone: zone,
        });
      }

      // Check departure surge (2 hours before to 30 min after)
      const minutesUntilDeparture = this.getMinutesDifference(departure, now);
      if (minutesUntilDeparture >= this.DEPARTURE_SURGE_START_MIN && minutesUntilDeparture <= this.ARRIVAL_SURGE_END_MIN) {
        const zone = this.getTerminalZoneId(ship.terminal);
        alerts.push({
          ship,
          type: 'departure',
          timeUntil: Math.max(0, minutesUntilDeparture),
          message: `🚢 ${ship.name} departing from ${ship.terminal} at ${new Date(ship.departureTime).toLocaleTimeString()}. Position near hotels/airport for pickups!`,
          recommendedZone: zone,
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate surge multiplier for cruise events
   */
  calculateCruiseSurgeImpact(zoneId: string, currentTime: Date): number {
    const ships = this.getMockCruiseSchedule();
    let impact = 0;

    for (const ship of ships) {
      const arrival = new Date(ship.arrivalTime);
      const departure = new Date(ship.departureTime);

      // Arrival surge window: 30 min before to 2 hours after
      const minutesSinceArrival = this.getMinutesDifference(currentTime, arrival);
      if (minutesSinceArrival >= this.ARRIVAL_SURGE_START_MIN && minutesSinceArrival <= this.ARRIVAL_SURGE_END_MIN) {
        // High impact on terminal zone and airport
        if (zoneId === this.getTerminalZoneId('Pier 91') || zoneId === this.getTerminalZoneId('Pier 66')) {
          impact += this.TERMINAL_IMPACT_ARRIVAL; // Major impact at terminal
        } else if (zoneId === 'waterfront_piers' || zoneId === 'colman_dock_ferry') {
          impact += this.WATERFRONT_IMPACT_ARRIVAL; // Overflow around waterfront
        } else if (zoneId === 'seatac') {
          impact += this.SEATAC_IMPACT_ARRIVAL; // Passengers heading to airport
        } else if (zoneId === 'belltown_hotels' || zoneId === 'downtown_hotel_row_union') {
          impact += this.HOTELS_IMPACT_ARRIVAL; // Passengers heading to hotels
        }
      }

      // Departure surge window: 2 hours before to 30 min after
      const minutesUntilDeparture = this.getMinutesDifference(departure, currentTime);
      if (minutesUntilDeparture >= this.DEPARTURE_SURGE_START_MIN && minutesUntilDeparture <= this.DEPARTURE_SURGE_END_MIN) {
        if (zoneId === this.getTerminalZoneId('Pier 91') || zoneId === this.getTerminalZoneId('Pier 66')) {
          impact += this.TERMINAL_IMPACT_DEPARTURE; // Terminal pickup surge
        } else if (zoneId === 'belltown_hotels' || zoneId === 'downtown_hotel_row_union') {
          impact += this.HOTELS_IMPACT_DEPARTURE; // Hotel pickups heading to terminal
        } else if (zoneId === 'seatac') {
          impact += this.SEATAC_IMPACT_DEPARTURE; // Some passengers from airport
        }
      }
    }

    return impact;
  }

  /**
   * Get smart recommendations based on cruise schedule
   */
  async getRecommendations(): Promise<string[]> {
    const alerts = await this.getSurgeAlerts();
    const recommendations: string[] = [];

    if (alerts.length === 0) {
      return ['No cruise ships scheduled today.'];
    }

    for (const alert of alerts) {
      if (alert.timeUntil < 30 && alert.type === 'arrival') {
        recommendations.push(
          `🔥 ${alert.ship.name} arriving NOW! Head to ${alert.ship.terminal} immediately.`
        );
      } else if (alert.timeUntil < 60) {
        recommendations.push(
          `⏰ Position near ${alert.ship.terminal} in ${Math.round(alert.timeUntil)} minutes for ${alert.type} surge.`
        );
      }
    }

    return recommendations;
  }
}

