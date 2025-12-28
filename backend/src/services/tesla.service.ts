import axios from 'axios';

/**
 * Tesla API Service
 * 
 * Provides real-time vehicle data from Tesla account.
 * Support for both official Fleet API and unofficial owner API.
 */

export interface TeslaVehicleData {
  id: string;
  vehicle_id: number;
  display_name: string;
  battery_level: number;
  battery_range: number; // in miles
  charging_state: 'Charging' | 'Disconnected' | 'Complete' | 'Starting';
  charge_rate: number; // mi/hr
  timestamp: string;
  is_demo: boolean;
}

export class TeslaService {
  private accessToken: string | null = process.env.TESLA_ACCESS_TOKEN || null;
  private isDemo = !process.env.TESLA_ACCESS_TOKEN;

  /**
   * Get latest vehicle data
   */
  async getVehicleData(): Promise<TeslaVehicleData> {
    if (this.isDemo) {
      return this.getMockData();
    }

    try {
      // Note: This is a simplified example. Real Tesla API requires 
      // getting vehicle list first, then specific vehicle data.
      const response = await axios.get('https://owner-api.teslamotors.com/api/1/vehicles', {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      const vehicle = response.data.response[0];
      const dataResponse = await axios.get(`https://owner-api.teslamotors.com/api/1/vehicles/${vehicle.id_s}/vehicle_data`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      const d = dataResponse.data.response;
      return {
        id: vehicle.id_s,
        vehicle_id: vehicle.vehicle_id,
        display_name: vehicle.display_name,
        battery_level: d.charge_state.battery_level,
        battery_range: d.charge_state.battery_range,
        charging_state: d.charge_state.charging_state,
        charge_rate: d.charge_state.charge_rate,
        timestamp: new Date().toISOString(),
        is_demo: false
      };
    } catch (error) {
      console.error('Tesla API error, falling back to mock data:', error);
      return this.getMockData();
    }
  }

  private getMockData(): TeslaVehicleData {
    return {
      id: 'mock_123',
      vehicle_id: 12345,
      display_name: 'Tesla Model 3',
      battery_level: 78,
      battery_range: 242,
      charging_state: 'Disconnected',
      charge_rate: 0,
      timestamp: new Date().toISOString(),
      is_demo: true
    };
  }
}

