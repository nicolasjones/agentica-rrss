import React from 'react';
import { Instagram, Facebook, Youtube, Music, Globe } from 'lucide-react';

const ALL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-400' },
  { id: 'facebook', label: 'Facebook', Icon: Facebook, color: 'text-blue-400' },
  { id: 'youtube', label: 'YouTube', Icon: Youtube, color: 'text-red-400' },
  { id: 'tiktok', label: 'TikTok', Icon: Music, color: 'text-white' },
];

const PlatformSelector = ({ selected = [], onChange }) => {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex border border-[var(--outline-variant)] rounded-sm overflow-hidden">
      {ALL_PLATFORMS.map(({ id, Icon, color }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={`flex items-center justify-center p-2.5 transition-all
              ${isSelected
                ? `bg-white/10 ${color}`
                : 'text-gray-700 hover:text-gray-400 hover:bg-white/5'
              } border-r border-[var(--outline-variant)] last:border-r-0`}
            title={id.toUpperCase()}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
};

export default PlatformSelector;
