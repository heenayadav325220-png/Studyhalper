A digital clock component and a simple page were added.

Files added on branch feature/digital-clock:
- src/components/DigitalClock.tsx
- src/utils/timezones.ts
- src/pages/Clocks.tsx

Usage:
- Import and render the component where you want the clocks to appear:

  import DigitalClock from 'src/components/DigitalClock';
  
  <DigitalClock />

- Options:
  - zones: pass an array of {label, tz} to override presets
  - showDate: boolean (default true)
  - compact: boolean (smaller time font)

Examples:
  <DigitalClock compact />
  <DigitalClock zones={[{label: 'Paris', tz: 'Europe/Paris'}]} />
