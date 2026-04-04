import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
  facebook:  'bg-blue-400',
  youtube:   'bg-red-400',
  tiktok:    'bg-white/60',
};

const PLATFORM_DOT_INLINE = {
  instagram: 'bg-pink-400',
  facebook:  'bg-blue-400',
  youtube:   'bg-red-400',
  tiktok:    'bg-white/60',
};

const truncate = (str, len) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
};

const PostMicroCard = ({ post, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(post); }}
    className="w-full flex items-center gap-1 px-1 py-0.5 rounded-sm bg-[var(--surface-highest)] border border-[var(--outline-variant)] hover:border-[var(--primary)]/50 transition-all text-left"
    title={post.concept_title || post.caption}
  >
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PLATFORM_DOT_INLINE[post.platform] || 'bg-gray-400'}`} />
    <span className="text-[7px] font-mono font-black text-gray-300 truncate leading-none">
      {truncate(post.concept_title || post.caption, 16)}
    </span>
  </button>
);

const getWeekDays = (year, month, day) => {
  const date = new Date(year, month, day);
  const dow = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const CalendarView = ({
  events = [],
  posts = [],
  mode = 'strategy',
  onDayClick,
  onPostClick,
  onAddPost,
}) => {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() });
  const [calMode, setCalMode] = useState('month'); // 'month' | 'week'

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

  const prevPeriod = () => {
    if (calMode === 'month') {
      setCursor(c => {
        const m = c.month === 0 ? 11 : c.month - 1;
        const y = c.month === 0 ? c.year - 1 : c.year;
        return { ...c, year: y, month: m };
      });
    } else {
      setCursor(c => {
        const d = new Date(c.year, c.month, c.day - 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };

  const nextPeriod = () => {
    if (calMode === 'month') {
      setCursor(c => {
        const m = c.month === 11 ? 0 : c.month + 1;
        const y = c.month === 11 ? c.year + 1 : c.year;
        return { ...c, year: y, month: m };
      });
    } else {
      setCursor(c => {
        const d = new Date(c.year, c.month, c.day + 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };

  const isToday = (d, m, y) =>
    d === today.getDate() && m === today.getMonth() && y === today.getFullYear();

  const dateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const renderCellContent = (day, month, year) => {
    const key = dateKey(year, month, day);
    const dayPosts = postsByDate[key] || [];

    if (mode === 'strategy') {
      const dayEvents = eventsByDay[day] || [];
      return (
        <>
          {dayEvents.slice(0, 2).map(ev => (
            <div
              key={ev.id}
              className={`text-[7px] font-mono font-black px-1 py-0.5 rounded-sm truncate ${CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.other}`}
              title={ev.title}
            >
              {ev.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-[7px] font-mono text-gray-500">+{dayEvents.length - 2} más</div>
          )}
        </>
      );
    }

    return (
      <>
        {dayPosts.slice(0, 2).map((post, i) => (
          <PostMicroCard key={i} post={post} onClick={onPostClick || (() => {})} />
        ))}
        {dayPosts.length > 2 && (
          <div className="text-[7px] font-mono text-gray-500">+{dayPosts.length - 2} más</div>
        )}
      </>
    );
  };

  const renderDayCell = (dayNum, month, year, minH = 'min-h-[52px]') => {
    const key = dateKey(year, month, dayNum);
    const todayCell = isToday(dayNum, month, year);
    return (
      <div
        key={key}
        onClick={() => onDayClick && onDayClick({ year, month, day: dayNum })}
        className={`${minH} p-1 rounded-sm border transition-all text-left relative group cursor-pointer
          ${todayCell ? 'border-[var(--primary)]/60 bg-[var(--primary)]/10' : 'border-[var(--outline-variant)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5'}
        `}
      >
        <span className={`text-[9px] font-mono font-black block mb-1 ${todayCell ? 'text-[var(--primary)]' : 'text-gray-500'}`}>
          {dayNum}
        </span>
        <div className="space-y-0.5">
          {renderCellContent(dayNum, month, year)}
        </div>
        {onAddPost && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddPost(key); }}
            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center bg-[var(--secondary)]/20 border border-[var(--secondary)]/40 text-[var(--secondary)] hover:bg-[var(--secondary)]/40 rounded-sm"
            title="Agregar post"
          >
            <Plus size={8} />
          </button>
        )}
      </div>
    );
  };

  const renderMonth = () => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="min-h-[52px]" />;
          }
          return renderDayCell(day, cursor.month, cursor.year, 'min-h-[52px]');
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const weekDays = getWeekDays(cursor.year, cursor.month, cursor.day);
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) =>
          renderDayCell(d.getDate(), d.getMonth(), d.getFullYear(), 'min-h-[120px]')
        )}
      </div>
    );
  };

  const headerLabel = calMode === 'month'
    ? `${MONTHS[cursor.month]} ${cursor.year}`
    : (() => {
        const wk = getWeekDays(cursor.year, cursor.month, cursor.day);
        const s = wk[0], e = wk[6];
        if (s.getMonth() === e.getMonth()) {
          return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
        }
        return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
      })();

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevPeriod} className="p-1 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-sm font-mono font-black text-white uppercase tracking-widest">
            {headerLabel}
          </span>
          <span className={`text-[10px] font-mono font-black px-2 py-1 rounded-sm uppercase ${mode === 'strategy' ? 'bg-[var(--secondary)] text-black' : 'bg-[var(--primary)] text-white'}`}>
            {mode === 'strategy' ? 'MAPA' : 'SEÑAL'}
          </span>
          <div className="flex border border-[var(--outline-variant)] rounded-sm overflow-hidden">
            <button
              onClick={() => setCalMode('month')}
              className={`px-2 py-1 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                ${calMode === 'month' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              MES
            </button>
            <button
              onClick={() => setCalMode('week')}
              className={`px-2 py-1 text-[9px] font-mono font-black uppercase tracking-widest transition-all
                ${calMode === 'week' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              SEMANA
            </button>
          </div>
        </div>
        <button onClick={nextPeriod} className="p-1 text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-mono font-black text-gray-600 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {calMode === 'month' ? renderMonth() : renderWeek()}

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
