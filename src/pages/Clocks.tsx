import React from 'react';
import DigitalClock from '../components/DigitalClock';

export default function ClocksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">World Clocks</h1>
      <DigitalClock />
    </div>
  );
}
