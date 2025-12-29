import { DriverSupplyEstimate, Zone, WeatherConditions, Event } from '../types';

/**
 * DriverSupplyService - Estimates driver supply using heuristic models
 * 
 * This service provides a proxy estimation of driver availability in each zone
 * based on observable factors that correlate with driver behavior:
 * - Time of day / day of week patterns
 * - Weather conditions (bad weather = fewer drivers)
 * - Historical zone attractiveness (high-earning zones attract more drivers)
 * - Event spillover (drivers migrate toward high-demand events)
 * - Proximity to driver "idle spots" (airports, gas stations, rest areas)
 */
export class DriverSupplyService {
  // Historical baseline: average number of drivers per zone during peak hours
  private readonly BASELINE_DRIVERS_PER_ZONE = 15;

  // Known driver idle/staging spots in Seattle (where drivers wait for rides)
  private readonly DRIVER_STAGING_SPOTS = [
    { name: 'SeaTac Airport Cell Lot', zoneId: 'Airport', multiplier: 2.5 },
    { name: 'Capitol Hill Gas Stations', zoneId: 'Capitol Hill', multiplier: 1.3 },
    { name: 'Downtown Waterfront Parking', zoneId: 'Downtown', multiplier: 1.4 },
    { name: 'UDistrict Ave Parking', zoneId: 'University District', multiplier: 1.2 },
    { name: 'Fremont Coffee Shops', zoneId: 'Fremont', multiplier: 1.1 },
  ];

  /**
   * Estimate driver supply for a specific zone
   */
  estimateSupply(
    zone: Zone,
    currentTime: Date = new Date(),
    weather?: WeatherConditions,
    events?: Event[]
  ): DriverSupplyEstimate {
    let estimatedDrivers = this.BASELINE_DRIVERS_PER_ZONE;

    // 1. Time of Day Factor (fewer drivers at night)
    const timeMultiplier = this.getTimeOfDayMultiplier(currentTime);
    estimatedDrivers *= timeMultiplier;

    // 2. Day of Week Factor (fewer drivers mid-week)
    const dayMultiplier = this.getDayOfWeekMultiplier(currentTime);
    estimatedDrivers *= dayMultiplier;

    // 3. Weather Factor (bad weather reduces supply)
    if (weather) {
      const weatherMultiplier = this.getWeatherSupplyMultiplier(weather);
      estimatedDrivers *= weatherMultiplier;
    }

    // 4. Staging Spot Proximity (known driver idle areas)
    const stagingMultiplier = this.getStagingSpotMultiplier(zone.id);
    estimatedDrivers *= stagingMultiplier;

    // 5. Event Migration (drivers move toward high-demand events)
    if (events && events.length > 0) {
      const eventMultiplier = this.getEventMigrationMultiplier(zone.id, events, currentTime);
      estimatedDrivers *= eventMultiplier;
    }

    // Round to nearest integer
    estimatedDrivers = Math.round(estimatedDrivers);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(weather, events);

    // Calculate score modifier (supply/demand imbalance)
    const modifier = this.calculateScoreModifier(estimatedDrivers);

    return {
      estimatedDrivers,
      confidence,
      source: 'heuristic',
      modifier,
    };
  }

  /**
   * Time of Day Multiplier
   * Peak hours (7-9am, 5-8pm): 1.2x drivers
   * Late night (12-5am): 0.3x drivers
   */
  private getTimeOfDayMultiplier(time: Date): number {
    const hour = time.getHours();

    // Late night / early morning (12am - 5am): Very few drivers
    if (hour >= 0 && hour < 5) {
      return 0.3;
    }

    // Morning commute (7am - 9am): High supply
    if (hour >= 7 && hour < 9) {
      return 1.2;
    }

    // Midday (9am - 4pm): Normal supply
    if (hour >= 9 && hour < 16) {
      return 1.0;
    }

    // Evening rush (5pm - 8pm): Peak supply
    if (hour >= 17 && hour < 20) {
      return 1.3;
    }

    // Late evening (8pm - 12am): Moderate supply
    if (hour >= 20 || hour < 1) {
      return 0.8;
    }

    return 1.0;
  }

  /**
   * Day of Week Multiplier
   * Weekends: More drivers (part-timers join)
   * Weekdays: Baseline
   */
  private getDayOfWeekMultiplier(time: Date): number {
    const dayOfWeek = time.getDay(); // 0 = Sunday, 6 = Saturday

    // Friday & Saturday nights: Highest supply
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 1.3;
    }

    // Sunday: Moderate supply
    if (dayOfWeek === 0) {
      return 1.1;
    }

    // Monday - Thursday: Baseline
    return 1.0;
  }

  /**
   * Weather Supply Multiplier
   * Bad weather = fewer drivers willing to work
   * (This is different from demand - bad weather increases demand but decreases supply!)
   */
  private getWeatherSupplyMultiplier(weather: WeatherConditions): number {
    let multiplier = 1.0;

    // Rain reduces supply (some drivers stay home)
    if (weather.isRaining) {
      multiplier *= 0.85;
    }

    // Extreme cold reduces supply
    if (weather.temperature < 32) {
      multiplier *= 0.9;
    }

    // Very cold reduces supply further
    if (weather.temperature < 20) {
      multiplier *= 0.8;
    }

    return multiplier;
  }

  /**
   * Staging Spot Multiplier
   * Zones with known driver idle spots have more supply
   */
  private getStagingSpotMultiplier(zoneId: string): number {
    const spot = this.DRIVER_STAGING_SPOTS.find((s) => s.zoneId === zoneId);
    return spot ? spot.multiplier : 1.0;
  }

  /**
   * Event Migration Multiplier
   * Drivers migrate TOWARD zones with ending events (high demand)
   * Drivers migrate AWAY from zones with starting events (supply is low there)
   */
  private getEventMigrationMultiplier(zoneId: string, events: Event[], currentTime: Date): number {
    let multiplier = 1.0;

    // Check if this zone has any events ending soon
    const zoneEvents = events.filter((e) => e.zoneId === zoneId);

    for (const event of zoneEvents) {
      const endTime = new Date(event.endTime);
      const minutesUntilEnd = (endTime.getTime() - currentTime.getTime()) / (1000 * 60);

      // Event ending in next 60 minutes: Drivers are migrating here
      if (minutesUntilEnd > 0 && minutesUntilEnd <= 60) {
        multiplier *= 1.5; // 50% more drivers near ending events
      }

      // Event just ended (within last 30 min): Peak supply
      if (minutesUntilEnd < 0 && minutesUntilEnd >= -30) {
        multiplier *= 1.8; // 80% more drivers right after event
      }

      // Event starting in next 30 minutes: Drivers are avoiding (anticipating surge pricing)
      const startTime = new Date(event.startTime);
      const minutesUntilStart = (startTime.getTime() - currentTime.getTime()) / (1000 * 60);
      if (minutesUntilStart > 0 && minutesUntilStart <= 30) {
        multiplier *= 0.7; // 30% fewer drivers (waiting for surge)
      }
    }

    return multiplier;
  }

  /**
   * Calculate confidence level based on data availability
   */
  private calculateConfidence(weather?: WeatherConditions, events?: Event[]): 'high' | 'medium' | 'low' {
    // High confidence: We have weather AND event data
    if (weather && events && events.length > 0) {
      return 'high';
    }

    // Medium confidence: We have partial data
    if (weather || (events && events.length > 0)) {
      return 'medium';
    }

    // Low confidence: Only using time-based heuristics
    return 'low';
  }

  /**
   * Calculate score modifier based on supply/demand imbalance
   * Low supply = higher scores (more opportunity)
   * High supply = lower scores (more competition)
   */
  private calculateScoreModifier(estimatedDrivers: number): number {
    // If supply is very low (< 5 drivers), boost score significantly
    if (estimatedDrivers < 5) {
      return 25; // +25 points for very low supply
    }

    // If supply is low (5-10 drivers), moderate boost
    if (estimatedDrivers < 10) {
      return 15; // +15 points for low supply
    }

    // If supply is normal (10-20 drivers), no change
    if (estimatedDrivers <= 20) {
      return 0;
    }

    // If supply is high (20-30 drivers), slight penalty
    if (estimatedDrivers <= 30) {
      return -10; // -10 points for high supply
    }

    // If supply is very high (> 30 drivers), significant penalty
    return -20; // -20 points for very high supply (oversaturated)
  }

  /**
   * Get all zones with their supply estimates
   */
  estimateAllZones(
    zones: Zone[],
    currentTime: Date = new Date(),
    weather?: WeatherConditions,
    events?: Event[]
  ): Map<string, DriverSupplyEstimate> {
    const estimates = new Map<string, DriverSupplyEstimate>();

    for (const zone of zones) {
      const estimate = this.estimateSupply(zone, currentTime, weather, events);
      estimates.set(zone.id, estimate);
    }

    return estimates;
  }
}

