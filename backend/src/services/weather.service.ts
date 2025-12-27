import axios from 'axios';
import { WeatherConditions } from '../types/index.js';

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private seattleLat = 47.6062;
  private seattleLon = -122.3321;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCurrentWeather(): Promise<WeatherConditions> {
    // Use real API if key is valid (longer than 10 chars and not placeholder)
    const hasValidKey = this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'your_key_here';
    
    if (!hasValidKey) {
      // Return mock data if no API key
      return this.getMockWeather();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: this.seattleLat,
          lon: this.seattleLon,
          appid: this.apiKey,
          units: 'imperial',
        },
      });

      const data = response.data;
      const isRaining = data.weather.some((w: any) => 
        w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm'
      );

      // Get forecast for rain prediction
      const rainPrediction = await this.getRainPrediction();

      return {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        isRaining,
        rainPrediction,
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeather();
    }
  }

  private async getRainPrediction(): Promise<string> {
    const hasValidKey = this.apiKey && this.apiKey.length > 10 && this.apiKey !== 'your_key_here';
    
    if (!hasValidKey) {
      return 'No rain expected';
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: this.seattleLat,
          lon: this.seattleLon,
          appid: this.apiKey,
          units: 'imperial',
          cnt: 8, // Next 24 hours (3-hour intervals)
        },
      });

      const forecasts = response.data.list;
      
      for (let i = 0; i < forecasts.length; i++) {
        const forecast = forecasts[i];
        const hasRain = forecast.weather.some((w: any) => 
          w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm'
        );

        if (hasRain) {
          const hoursAway = i * 3;
          if (hoursAway <= 2) {
            return `Rain expected within ${hoursAway + 1} hours`;
          } else {
            return `Rain expected in ${hoursAway} hours`;
          }
        }
      }

      return 'No rain expected in next 24 hours';
    } catch (error) {
      return 'No rain expected';
    }
  }

  private getMockWeather(): WeatherConditions {
    // Mock weather with random rain chance
    const isRaining = Math.random() > 0.7; // 30% chance of rain in mock

    return {
      temperature: 55 + Math.floor(Math.random() * 10),
      description: isRaining ? 'light rain' : 'partly cloudy',
      isRaining,
      rainPrediction: isRaining ? 'Currently raining' : 'No rain expected',
    };
  }
}

