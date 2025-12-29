/**
 * Weather Surge Predictor
 * 
 * Rain = surge. Predict demand increases based on weather.
 */

import { WeatherConditions } from '../types/index.js';

export interface WeatherSurgePredict {
  currentSurgeMultiplier: number; // 1.0 = normal, 1.5 = 50% increase
  nextHourPrediction: number;
  alerts: string[];
  positioning: string; // Where to go
}

export class WeatherSurgeService {
  /**
   * Calculate surge multiplier from weather
   */
  calculateSurgeMultiplier(weather: WeatherConditions): number {
    let multiplier = 1.0;

    // Rain = major surge (INCREASED: 0.4 → 1.0 = 2x total)
    if (weather.isRaining) {
      multiplier += 1.0;
    }

    // Cold temperature = people less likely to walk (BOOSTED)
    if (weather.temperature < 40) {
      multiplier += 0.3;
    } else if (weather.temperature < 50) {
      multiplier += 0.2;
    }

    // Check for heavy rain indicators (BOOSTED)
    const desc = weather.description.toLowerCase();
    if (desc.includes('heavy') || desc.includes('storm')) {
      multiplier += 0.5;
    }

    return Math.min(2.5, multiplier); // Cap at 2.5x (increased from 2.0x)
  }

  /**
   * Predict next hour surge based on forecast
   */
  predictNextHour(currentWeather: WeatherConditions): WeatherSurgePredict {
    const currentMultiplier = this.calculateSurgeMultiplier(currentWeather);
    const alerts: string[] = [];
    let positioning = 'Stay in current high-demand areas';

    // Rain starting soon
    if (currentWeather.rainPrediction.toLowerCase().includes('starting')) {
      alerts.push('☔ Rain starting soon! Demand will spike. Position at busy zones NOW.');
      positioning = 'Position at downtown/Capitol Hill/Belltown before rain starts';
    }

    // Currently raining
    if (currentWeather.isRaining) {
      alerts.push('🌧️ Raining now! High demand. Stay active.');
      positioning = 'Prioritize short trips to maximize earnings during surge';
    }

    // Rain ending
    if (currentWeather.rainPrediction.toLowerCase().includes('ending')) {
      alerts.push('⛅ Rain ending. Surge will decrease. Last chance for rain bonus.');
    }

    return {
      currentSurgeMultiplier: currentMultiplier,
      nextHourPrediction: currentMultiplier,
      alerts,
      positioning,
    };
  }

  /**
   * Get positioning recommendation based on weather
   */
  getWeatherPositioning(weather: WeatherConditions): string[] {
    const recommendations: string[] = [];

    if (weather.isRaining || weather.rainPrediction.toLowerCase().includes('starting')) {
      recommendations.push('Focus on high-density areas: Downtown, Capitol Hill, Belltown');
      recommendations.push('Avoid residential zones - people stay home in rain');
      recommendations.push('Stay near bars/restaurants - short high-value trips');
    }

    if (weather.temperature < 40) {
      recommendations.push('Cold weather = less walking. All zones see increased demand');
    }

    return recommendations;
  }
}




