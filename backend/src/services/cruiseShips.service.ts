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
  // Seattle cruise terminals (for future expansion)
  // @ts-ignore - unused but kept for reference
  private readonly TERMINALS = {
    pier91: {
      name: 'Pier 91 (Smith Cove Terminal)',
      coordinates: { lat: 47.6344, lng: -122.3988 },
      zoneId: 'magnolia',
      capacity: 4000,
    },
    pier66: {
      name: 'Pier 66 (Bell Street Cruise Terminal)',
      coordinates: { lat: 47.6116, lng: -122.3515 },
      zoneId: 'waterfront',
      capacity: 2500,
    },
  };

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
      const minutesUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60);
      if (minutesUntilArrival >= -120 && minutesUntilArrival <= 30) {
        const zone = ship.terminal === 'Pier 91' ? 'magnolia' : 'waterfront';
        alerts.push({
          ship,
          type: 'arrival',
          timeUntil: Math.max(0, minutesUntilArrival),
          message: `🚢 ${ship.name} arriving at ${ship.terminal} with ${ship.passengers.toLocaleString()} passengers! Surge expected for airport/hotel rides.`,
          recommendedZone: zone,
        });
      }

      // Check departure surge (2 hours before to 30 min after)
      const minutesUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60);
      if (minutesUntilDeparture >= -30 && minutesUntilDeparture <= 120) {
        const zone = ship.terminal === 'Pier 91' ? 'magnolia' : 'waterfront';
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
      const minutesSinceArrival = (currentTime.getTime() - arrival.getTime()) / (1000 * 60);
      if (minutesSinceArrival >= -30 && minutesSinceArrival <= 120) {
        // High impact on terminal zone and airport
        if (zoneId === 'magnolia' || zoneId === 'waterfront') {
          impact += 30; // Major impact at terminal
        } else if (zoneId === 'airport') {
          impact += 20; // Passengers heading to airport
        } else if (zoneId === 'downtown') {
          impact += 15; // Passengers heading to hotels
        }
      }

      // Departure surge window: 2 hours before to 30 min after
      const minutesUntilDeparture = (departure.getTime() - currentTime.getTime()) / (1000 * 60);
      if (minutesUntilDeparture >= -30 && minutesUntilDeparture <= 120) {
        if (zoneId === 'magnolia' || zoneId === 'waterfront') {
          impact += 25; // Terminal pickup surge
        } else if (zoneId === 'downtown') {
          impact += 15; // Hotel pickups heading to terminal
        } else if (zoneId === 'airport') {
          impact += 10; // Some passengers from airport
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

