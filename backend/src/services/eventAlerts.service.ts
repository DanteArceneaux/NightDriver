import { Event } from '../types/index.js';

export interface EventAlert {
  type: 'doors_open' | 'encore';
  event: Event;
  urgency: 'high' | 'medium';
  message: string;
  minutesUntil: number;
}

export class EventAlertsService {
  detectEventAlerts(events: Event[], currentTime: Date, alertMinutes: number = 60): EventAlert[] {
    const alerts: EventAlert[] = [];

    for (const event of events) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const minutesUntilStart = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
      const minutesUntilEnd = (eventEnd.getTime() - currentTime.getTime()) / (1000 * 60);

      // "Doors Open" Alert - event starting soon
      if (minutesUntilStart > 0 && minutesUntilStart <= alertMinutes) {
        const urgency = minutesUntilStart <= 30 ? 'high' : 'medium';
        alerts.push({
          type: 'doors_open',
          event,
          urgency,
          message: `${event.name} starts in ${Math.round(minutesUntilStart)} minutes. High drop-off demand expected at ${event.venue}.`,
          minutesUntil: Math.round(minutesUntilStart),
        });
      }

      // "Encore" Alert - event ending soon
      if (minutesUntilEnd > 0 && minutesUntilEnd <= alertMinutes) {
        const urgency = minutesUntilEnd <= 30 ? 'high' : 'medium';
        alerts.push({
          type: 'encore',
          event,
          urgency,
          message: `${event.name} ends in ${Math.round(minutesUntilEnd)} minutes. SURGE for pick-ups at ${event.venue}!`,
          minutesUntil: Math.round(minutesUntilEnd),
        });
      }
    }

    // Sort by urgency, then by minutes until
    return alerts.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency === 'high' ? -1 : 1;
      }
      return a.minutesUntil - b.minutesUntil;
    });
  }
}

