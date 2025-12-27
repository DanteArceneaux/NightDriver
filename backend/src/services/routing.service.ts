import axios from 'axios';
import type { Coordinates } from '../types/index.js';

export interface RouteInfo {
  travelTimeMinutes: number;
  distanceMiles: number;
  trafficDelayMinutes: number;
  route: Array<{ lat: number; lng: number }>;
}

export interface MultiStopRouteInfo {
  totalTravelTimeMinutes: number;
  totalDistanceMiles: number;
  totalTrafficDelayMinutes: number;
  legs: Array<{
    from: string;
    to: string;
    travelTimeMinutes: number;
    distanceMiles: number;
    route: Array<{ lat: number; lng: number }>;
  }>;
}

export class RoutingService {
  private apiKey: string;
  private baseUrl = 'https://api.tomtom.com/routing/1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateRoute(
    from: Coordinates,
    to: Coordinates,
    departAt?: Date
  ): Promise<RouteInfo> {
    if (!this.apiKey || this.apiKey === 'your_key_here') {
      return this.getMockRoute(from, to);
    }

    try {
      const departTime = departAt || new Date();
      const departAtParam = departTime.toISOString();

      const response = await axios.get(
        `${this.baseUrl}/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json`,
        {
          params: {
            key: this.apiKey,
            traffic: true,
            departAt: departAtParam,
            routeType: 'fastest',
            travelMode: 'car',
          },
        }
      );

      const route = response.data.routes[0];
      const summary = route.summary;
      
      // Extract route points
      const routePoints = route.legs[0].points.map((point: any) => ({
        lat: point.latitude,
        lng: point.longitude,
      }));

      return {
        travelTimeMinutes: Math.ceil(summary.travelTimeInSeconds / 60),
        distanceMiles: parseFloat((summary.lengthInMeters * 0.000621371).toFixed(2)),
        trafficDelayMinutes: Math.ceil(summary.trafficDelayInSeconds / 60),
        route: routePoints,
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return this.getMockRoute(from, to);
    }
  }

  private getMockRoute(from: Coordinates, to: Coordinates): RouteInfo {
    // Simple Haversine distance for mock
    const R = 3959; // Earth radius in miles
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate time: 30 mph average in city
    const travelTime = Math.ceil((distance / 30) * 60);

    return {
      travelTimeMinutes: travelTime,
      distanceMiles: parseFloat(distance.toFixed(2)),
      trafficDelayMinutes: Math.floor(travelTime * 0.2), // 20% delay
      route: [from, to], // Simple straight line for mock
    };
  }

  async calculateMultiStopRoute(
    stops: Array<{ name: string; coordinates: Coordinates }>,
    departAt?: Date
  ): Promise<MultiStopRouteInfo> {
    if (!stops || stops.length < 2) {
      throw new Error('At least 2 stops are required for multi-stop routing');
    }

    const legs: MultiStopRouteInfo['legs'] = [];
    let totalTravelTime = 0;
    let totalDistance = 0;
    let totalDelay = 0;

    // Calculate each leg of the journey
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];

      const routeInfo = await this.calculateRoute(
        from.coordinates,
        to.coordinates,
        departAt
      );

      legs.push({
        from: from.name,
        to: to.name,
        travelTimeMinutes: routeInfo.travelTimeMinutes,
        distanceMiles: routeInfo.distanceMiles,
        route: routeInfo.route,
      });

      totalTravelTime += routeInfo.travelTimeMinutes;
      totalDistance += routeInfo.distanceMiles;
      totalDelay += routeInfo.trafficDelayMinutes;
    }

    return {
      totalTravelTimeMinutes: totalTravelTime,
      totalDistanceMiles: parseFloat(totalDistance.toFixed(2)),
      totalTrafficDelayMinutes: totalDelay,
      legs,
    };
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

