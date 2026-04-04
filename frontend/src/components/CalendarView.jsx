import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATEGORY_COLORS = {
  gig:          'bg-[var(--primary)]/80 text-black',
  launch:       'bg-[var(--secondary)]/80 text-black',
  bts:          'bg-yellow-500/80 text-black',
  announcement: 'bg-blue-500/80 text-white',
  other:        'bg-gray-600 text-white',
};

const PLATFORM_DOT = {
  instagram: 'bg-pink-400',
  facebook: 'bg-blue-400',
  youtube: 'bg-red-400',
  tiktok: 'bg-white/60',
};

const CalendarView = ({ events = [], posts = [], mode = 'strategy', onDayClick }) => {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const eventsByDay = {};
  events.forEach(ev => {
    const d = new Date(ev.event_date + 'T00:00:00');
    if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month) {
      const key = d.getDate();
      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(ev);
    }
  });

  const postsByDate = {};
  posts.forEach(post => {
    const dateStr = post.scheduled_date;
    if (!postsByDate[dateStr]) postsByDate[dateStr] = [];
    postsByDate[dateStr].push(post);
  });

  const prev = () => {
    setCursor(c => {
      const m = c.month === 0 ? 11 : c.month - 1;
      const y = c.month === 0 ? c.year - 1 : c.year;
      return { year: y, month: m };
    });
  };

  const next = () => {
    setCursor(c => {
      const m = c.month === 11 ? 0 : c.month + 1;
      const y = c.month === 11 ? c.year + 1 : c.year;
      return { year: y, month: m };
    });
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && cursor.month === today.getMonth() && cursor.year === today.getFullYear();

  return (
    <div className="surface-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-1 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-black text-white uppercase tracking-widest">
            {MONTHS[cursor.month]} {cursor.year}
          </span>
          <span className={`text-[10px] font-mono font-black px-2 py-1 rounded-sm uppercase ${mode === 'strategy' ? 'bg-[var(--secondary)] text-black' : 'bg-[var(--primary)] text-white'}`}>
            {mode === 'strategy' ? 'MAPA' : 'SEÑAL'}
          </span>
        </div>
        <button onClick={next} className="p-1 text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-mono font-black text-gray-600 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          const dayKey = day ? `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
          const dayPosts = dayKey ? (postsByDate[dayKey] || []) : [];

          return (
            <div
              key={idx}
              onClick={() => day && onDayClick && onDayClick({ year: cursor.year, month: cursor.month, day })}
              className={`min-h-[52px] p-1 rounded-sm border transition-all text-left
                ${day ? 'cursor-pointer hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5' : ''}
                ${isToday(day) ? 'border-[var(--primary)]/60 bg-[var(--primary)]/10' : 'border-[var(--outline-variant)]'}
              `}
            >
              {day && (
                <>
                  <span className={`text-[9px] font-mono font-black block mb-1 ${isToday(day) ? 'text-[var(--primary)]' : 'text-gray-500'}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {mode === 'strategy' ? (
                      <>
                        {(eventsByDay[day] || []).slice(0, 2).map(ev => (
                          <div
                            key={ev.id}
                            className={`text-[7px] font-mono font-black px-1 py-0.5 rounded-sm truncate ${CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.other}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {(eventsByDay[day] || []).length > 2 && (
                          <div className="text-[7px] font-mono text-gray-500">
                            +{eventsByDay[day].length - 2} más
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex gap-1 flex-wrap">
                          {dayPosts.slice(0, 3).map((post, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PLATFORM_DOT[post.platform] || 'bg-gray-400'}`}
                              title={post.concept_title || post.caption}
                            />
                          ))}
                        </div>
                        {dayPosts.length > 3 && (
                          <div className="text-[7px] font-mono text-gray-500">
                            +{dayPosts.length - 3}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--outline-variant)]">
        {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-sm ${cls.split(' ')[0]}`} />
            <span className="text-[9px] font-mono text-gray-500 uppercase">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
