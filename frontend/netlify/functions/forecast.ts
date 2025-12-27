import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const now = new Date();
  const points = [];

  for (let i = 0; i < 8; i++) {
    const forecastTime = new Date(now.getTime() + i * 3600000);
    const hour = forecastTime.getHours();

    // Generate top zones for each hour
    const topZones = [
      { id: 'downtown', name: 'Downtown Seattle', score: 60 + Math.floor(Math.random() * 30) },
      { id: 'capitol-hill', name: 'Capitol Hill', score: 50 + Math.floor(Math.random() * 35) },
      { id: 'seatac', name: 'SeaTac Airport', score: 55 + Math.floor(Math.random() * 25) },
    ].sort((a, b) => b.score - a.score);

    points.push({
      time: forecastTime.toISOString(),
      hour,
      topZones,
    });
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ points }),
  };
};

