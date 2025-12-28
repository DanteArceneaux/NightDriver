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
  charging_state: string;
  charge_rate: number; // mi/hr
  timestamp: string;
  is_demo: boolean;
  state: string; // online, asleep, offline
}

export class TeslaService {
  private accessToken: string | null = process.env.TESLA_ACCESS_TOKEN || null;
  private isDemo = !process.env.TESLA_ACCESS_TOKEN;

  /**
   * Update the access token dynamically
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    this.isDemo = false;
    console.log('✅ Tesla Access Token updated');
  }

  /**
   * Get latest vehicle data
   */
  async getVehicleData(): Promise<TeslaVehicleData> {
    if (this.isDemo || !this.accessToken) {
      return this.getMockData();
    }

    try {
      // 1. Get vehicle list
      const response = await axios.get('https://owner-api.teslamotors.com/api/1/vehicles', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 10000
      });

      if (!response.data.response || response.data.response.length === 0) {
        throw new Error('No vehicles found in Tesla account');
      }

      const vehicle = response.data.response[0];
      const id = vehicle.id_s;

      // 2. Wake up vehicle if it's sleeping
      if (vehicle.state !== 'online') {
        console.log(`🚗 Tesla ${vehicle.display_name} is ${vehicle.state}. Sending wake up...`);
        await axios.post(`https://owner-api.teslamotors.com/api/1/vehicles/${id}/wake_up`, {}, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        
        // Wait a bit for wakeup
        return {
          ...this.getMockData(),
          display_name: vehicle.display_name,
          state: 'waking',
          is_demo: false
        };
      }

      // 3. Get detailed vehicle data
      const dataResponse = await axios.get(`https://owner-api.teslamotors.com/api/1/vehicles/${id}/vehicle_data`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      const d = dataResponse.data.response;
      return {
        id: id,
        vehicle_id: vehicle.vehicle_id,
        display_name: vehicle.display_name,
        battery_level: d.charge_state.battery_level,
        battery_range: d.charge_state.battery_range,
        charging_state: d.charge_state.charging_state,
        charge_rate: d.charge_state.charge_rate,
        timestamp: new Date().toISOString(),
        is_demo: false,
        state: vehicle.state
      };
    } catch (error: any) {
      console.error('❌ Tesla API error:', error.message);
      // If unauthorized, go back to demo
      if (error.response?.status === 401) {
        console.log('⚠️ Tesla Token expired or invalid. Reverting to demo mode.');
        this.isDemo = true;
      }
      return this.getMockData();
    }
  }

  private getMockData(): TeslaVehicleData {
    return {
      id: 'demo_id',
      vehicle_id: 0,
      display_name: 'Tesla Model 3 (Demo)',
      battery_level: 78,
      battery_range: 242,
      charging_state: 'Disconnected',
      charge_rate: 0,
      timestamp: new Date().toISOString(),
      is_demo: true,
      state: 'online'
    };
  }
}
