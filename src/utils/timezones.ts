const PRESET_ZONES = [
  { label: 'Local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  { label: 'UTC', tz: 'UTC' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Delhi', tz: 'Asia/Kolkata' },
];

export default PRESET_ZONES;
