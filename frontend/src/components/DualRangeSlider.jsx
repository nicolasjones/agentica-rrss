import { useRef } from 'react';

const MIN = 18;
const MAX = 65;

const toPercent = (v) => ((v - MIN) / (MAX - MIN)) * 100;

const label = (minVal, maxVal) =>
  `${minVal} – ${maxVal >= MAX ? '65+' : maxVal} años`;

const DualRangeSlider = ({ value = [18, 35], onChange, disabled }) => {
  const [minVal, maxVal] = value;
  const containerRef = useRef(null);

  if (disabled) {
    return (
      <p className="text-2xl font-display font-black text-white italic">
        {label(minVal, maxVal)}
      </p>
    );
  }

  const handleMin = (e) => {
    const v = Math.min(Number(e.target.value), maxVal - 1);
    onChange([v, maxVal]);
  };

  const handleMax = (e) => {
    const v = Math.max(Number(e.target.value), minVal + 1);
    onChange([minVal, v]);
  };

  const leftPct  = toPercent(minVal);
  const rightPct = toPercent(maxVal);

  return (
    <div className="space-y-3">
      <p className="text-2xl font-display font-black text-[var(--primary)] italic">
        {label(minVal, maxVal)}
      </p>

      <div ref={containerRef} className="relative flex items-center h-6 select-none">
        {/* Base track */}
        <div className="absolute inset-x-0 h-px bg-white/10" />

        {/* Active track */}
        <div
          className="absolute h-px bg-[var(--primary)]"
          style={{
            left:  `${leftPct}%`,
            width: `${rightPct - leftPct}%`,
            boxShadow: '0 0 6px var(--primary)',
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          className="dual-range absolute inset-x-0 w-full"
          min={MIN} max={MAX}
          value={minVal}
          onChange={handleMin}
          style={{ zIndex: minVal >= MAX - 2 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          className="dual-range absolute inset-x-0 w-full"
          min={MIN} max={MAX}
          value={maxVal}
          onChange={handleMax}
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex justify-between">
        <span className="text-[9px] font-mono text-gray-700 uppercase">{MIN} años</span>
        <span className="text-[9px] font-mono text-gray-700 uppercase">65+</span>
      </div>
    </div>
  );
};

export default DualRangeSlider;
