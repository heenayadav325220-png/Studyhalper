import React, { useEffect, useState } from 'react';
import PRESET_ZONES from '../utils/timezones';

type Zone = {
  label: string;
  tz: string;
};

type DigitalClockProps = {
  zones?: Zone[];
  showDate?: boolean;
  compact?: boolean;
};

function formatTime(date: Date, timeZone: string) {
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  });

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone,
  });

  return {
    time: timeFormatter.format(date),
    date: dateFormatter.format(date),
  };
}

export default function DigitalClock({ zones = PRESET_ZONES, showDate = true, compact = false }: DigitalClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map((z) => {
          const { time, date } = formatTime(now, z.tz);
          return (
            <div key={z.tz} className={`p-4 rounded-lg bg-slate-900 text-slate-50 ring-1 ring-slate-800`}>
              <div className="flex items-baseline justify-between">
                <div className="text-sm text-slate-400">{z.label}</div>
                <div className="text-xs text-slate-500">{z.tz}</div>
              </div>

              <div className={`mt-2 ${compact ? 'text-2xl' : 'text-3xl'} font-mono`}> {time} </div>

              {showDate && <div className="mt-1 text-sm text-slate-400">{date}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
