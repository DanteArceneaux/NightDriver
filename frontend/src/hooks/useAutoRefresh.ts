import { useState, useEffect } from 'react';

export function useAutoRefresh(interval: number = 300000) {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(interval / 1000);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - lastRefresh.getTime();
      const remaining = Math.max(0, Math.ceil((interval - elapsed) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setLastRefresh(new Date());
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [lastRefresh, interval]);

  return { countdown, lastRefresh };
}

