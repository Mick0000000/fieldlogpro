/**
 * Weather Routes
 *
 * Provides weather data based on GPS coordinates using the OpenWeather API.
 * Falls back to mock data when no API key is configured (development mode).
 *
 * Endpoint: GET /api/weather?lat={latitude}&lon={longitude}
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * OpenWeather API response type (partial - only fields we use)
 */
interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg?: number;
  };
  weather: Array<{
    main: string;
  }>;
}

/**
 * Convert degrees to compass direction
 * Divides 360 degrees into 8 compass points (45 degrees each)
 */
function degreesToDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Convert Kelvin to Fahrenheit
 * OpenWeather API returns temperature in Kelvin by default
 */
function kelvinToFahrenheit(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}

/**
 * Convert meters per second to miles per hour
 * OpenWeather API returns wind speed in m/s
 */
function msToMph(ms: number): number {
  return Math.round(ms * 2.237);
}

/**
 * GET /api/weather
 *
 * Fetches current weather data for the specified coordinates.
 *
 * Query Parameters:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 *
 * Response:
 * - temperature: Current temperature in Fahrenheit
 * - humidity: Humidity percentage (0-100)
 * - windSpeed: Wind speed in MPH
 * - windDirection: Compass direction (N, NE, E, SE, S, SW, W, NW)
 * - weatherCondition: Weather condition (Clear, Cloudy, Rainy, etc.)
 * - mock: Boolean flag indicating if mock data was returned (only present when true)
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lon } = req.query;

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'lat and lon query parameters are required' }
      });
    }

    // Validate lat/lon are valid numbers
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'lat and lon must be valid numbers' }
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'lat must be between -90 and 90' }
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'lon must be between -180 and 180' }
      });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    // If no API key, return mock data for development
    if (!apiKey) {
      console.log('[WEATHER] No API key configured, returning mock data');
      return res.json({
        temperature: 72,
        humidity: 45,
        windSpeed: 5,
        windDirection: 'NW',
        weatherCondition: 'Clear',
        mock: true
      });
    }

    // Fetch from OpenWeather API
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WEATHER] OpenWeather API error:', response.status, errorData);
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const data = await response.json() as OpenWeatherResponse;

    res.json({
      temperature: kelvinToFahrenheit(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: msToMph(data.wind.speed),
      windDirection: degreesToDirection(data.wind.deg || 0),
      weatherCondition: data.weather[0]?.main || 'Unknown'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
