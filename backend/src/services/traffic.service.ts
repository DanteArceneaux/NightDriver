import axios from 'axios';
import { zones } from '../data/zones.js';

export class TrafficService {
  private apiKey: string;
  private baseUrl = 'https://api.tomtom.com/traffic/services/4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCongestionData(): Promise<Map<string, number>> {
    if (!this.apiKey || this.apiKey === 'your_key_here') {
      // Return mock traffic data if no API key
      return this.getMockTraffic();
    }

    const trafficMap = new Map<string, number>();

    try {
      // Query traffic for each zone
      for (const zone of zones) {
        const congestion = await this.getZoneCongestion(zone.coordinates.lat, zone.coordinates.lng);
        trafficMap.set(zone.id, congestion);
      }

      return trafficMap;
    } catch (error) {
      console.error('Error fetching traffic:', error);
      return this.getMockTraffic();
    }
  }

  private async getZoneCongestion(lat: number, lng: number): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flowSegmentData/absolute/10/json`,
        {
          params: {
            key: this.apiKey,
            point: `${lat},${lng}`,
          },
        }
      );

      const data = response.data;
      const currentSpeed = data.flowSegmentData?.currentSpeed || 0;
      const freeFlowSpeed = data.flowSegmentData?.freeFlowSpeed || 1;

      // Calculate congestion level (0-10 scale)
      // Lower ratio = more congestion
      const ratio = currentSpeed / freeFlowSpeed;
      const congestion = Math.round((1 - ratio) * 10);

      return Math.max(0, Math.min(10, congestion));
    } catch (error) {
      return 3; // Default moderate congestion
    }
  }

  private getMockTraffic(): Map<string, number> {
    const trafficMap = new Map<string, number>();
    const hour = new Date().getHours();

    for (const zone of zones) {
      let congestion = 3; // Base congestion

      // Rush hour boost for certain zones
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        if (zone.id === 'downtown' || zone.id === 'slu') {
          congestion = 7;
        } else if (zone.id === 'belltown' || zone.id === 'capitol_hill') {
          congestion = 5;
        }
      }

      // Airport always has moderate traffic
      if (zone.id === 'seatac') {
        congestion = 5;
      }

      trafficMap.set(zone.id, congestion);
    }

    return trafficMap;
  }
}

