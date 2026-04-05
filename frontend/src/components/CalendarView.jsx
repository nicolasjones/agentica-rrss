import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATEGORY_COLORS = {
  gig:          'bg-[var(--primary)]/80 text-black',
  launch:       'bg-[var(--secondary)]/80 text-black',
  bts:          'bg-yellow-500/80 text-black',
  announcement: 'bg-blue-500/80 text-white',
  other:        'bg-gray-600 text-white',
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

// ── Draggable chips ───────────────────────────────────────────────────────────
const DraggableEventChip = ({ ev }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `event-${ev.id}`,
    data: { type: 'event', ev },
  });
  // No transform on original — DragOverlay is the sole visual ghost during drag
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0 : 1, touchAction: 'none' }}
      className={`text-[7px] font-mono font-black px-1 py-0.5 truncate cursor-grab active:cursor-grabbing select-none ${CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.other}`}
      title={ev.title}
    >
      {ev.title}
    </div>
  );
};

const DraggablePostChip = ({ post, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `post-${post.id}`,
    data: { type: 'post', post },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      data-testid="draggable-post"
      style={{ opacity: isDragging ? 0 : 1, touchAction: 'none' }}
      className="w-full flex items-center gap-1 px-1 py-0.5 bg-[var(--surface-highest)] border border-[var(--outline-variant)] hover:border-[var(--primary)]/50 cursor-grab active:cursor-grabbing select-none text-left"
      title={post.concept_title || post.caption}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PLATFORM_DOT_INLINE[post.platform] || 'bg-gray-400'}`} />
      <span className="text-[7px] font-mono font-black text-gray-300 truncate leading-none">
        {truncate(post.concept_title || post.caption, 16)}
      </span>
    </div>
  );
};

// ── Droppable day cell ────────────────────────────────────────────────────────
const DroppableCell = ({ dateKey, todayCell, minH, onAddPost, onCellClick, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const dayNum = parseInt(dateKey.split('-')[2], 10);
  return (
    <div
      ref={setNodeRef}
      data-testid="calendar-cell"
      onClick={() => onCellClick?.(dateKey)}
      className={`${minH} p-1 border transition-all text-left relative group cursor-pointer
        ${isOver
          ? 'border-[var(--primary)] bg-[var(--primary)]/15 scale-[1.01]'
          : todayCell
            ? 'border-[var(--primary)]/60 bg-[var(--primary)]/10'
            : 'border-[var(--outline-variant)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5'
        }`}
    >
      <span className={`text-[9px] font-mono font-black block mb-1 ${todayCell ? 'text-[var(--primary)]' : 'text-gray-500'}`}>
        {dayNum}
      </span>
      <div className="space-y-0.5">
        {children}
      </div>
      {onAddPost && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddPost(dateKey); }}
          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center bg-[var(--secondary)]/20 border border-[var(--secondary)]/40 text-[var(--secondary)] hover:bg-[var(--secondary)]/40"
          title="Agregar post"
        >
          <Plus size={8} />
        </button>
      )}
    </div>
  );
};

// ── CalendarView ─────────────────────────────────────────────────────────────
const CalendarView = ({
  events = [],
  posts = [],
  mode = 'strategy',
  onDayClick,
  onCellClick,     // click-anywhere callback (dateKey string) — used for MAPA quick-add
  onPostClick,
  onAddPost,
  onMoveEvent,     // (eventId, newDateKey) — DnD callback
  onMovePost,      // (postId, newDateKey) — DnD callback
}) => {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() });
  const [calMode, setCalMode] = useState('month');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // ── Index events + posts by date ──────────────────────────────────────────
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

  // ── Navigation ────────────────────────────────────────────────────────────
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

  // ── DnD handlers ─────────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const activeId = active.id;
    const newDateKey = over.id;
    if (activeId.startsWith('event-')) {
      const eventId = parseInt(activeId.replace('event-', ''), 10);
      onMoveEvent?.(eventId, newDateKey);
    } else if (activeId.startsWith('post-')) {
      const postId = parseInt(activeId.replace('post-', ''), 10);
      onMovePost?.(postId, newDateKey);
    }
  };

  // ── Cell content ─────────────────────────────────────────────────────────
  const renderCellContent = (day, month, year) => {
    const key = dateKey(year, month, day);
    const dayPosts = postsByDate[key] || [];

    if (mode === 'strategy') {
      const dayEvents = eventsByDay[day] || [];
      return (
        <>
          {dayEvents.slice(0, 3).map(ev => (
            <DraggableEventChip key={ev.id} ev={ev} />
          ))}
          {dayEvents.length > 3 && (
            <div className="text-[7px] font-mono text-gray-500">+{dayEvents.length - 3} más</div>
          )}
        </>
      );
    }

    return (
      <>
        {dayPosts.slice(0, 2).map((post) => (
          <DraggablePostChip key={post.id} post={post} onClick={onPostClick || (() => {})} />
        ))}
        {dayPosts.length > 2 && (
          <div className="text-[7px] font-mono text-gray-500">+{dayPosts.length - 2} más</div>
        )}
      </>
    );
  };

  // ── Render day cell ───────────────────────────────────────────────────────
  const renderDayCell = (dayNum, month, year, minH = 'min-h-[60px]') => {
    const key = dateKey(year, month, dayNum);
    const todayCell = isToday(dayNum, month, year);

    const handleClick = (dk) => {
      if (onCellClick) {
        onCellClick(dk);
      } else if (onDayClick) {
        const [y, m, d] = dk.split('-').map(Number);
        onDayClick({ year: y, month: m - 1, day: d });
      }
    };

    return (
      <DroppableCell
        key={key}
        dateKey={key}
        todayCell={todayCell}
        minH={minH}
        onAddPost={mode !== 'strategy' ? onAddPost : undefined}
        onCellClick={handleClick}
      >
        {renderCellContent(dayNum, month, year)}
      </DroppableCell>
    );
  };

  // ── Month / Week renders ─────────────────────────────────────────────────
  const renderMonth = () => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) =>
          day
            ? renderDayCell(day, cursor.month, cursor.year, 'min-h-[60px]')
            : <div key={`empty-${idx}`} className="min-h-[60px]" />
        )}
      </div>
    );
  };

  const renderWeek = () => {
    const weekDays = getWeekDays(cursor.year, cursor.month, cursor.day);
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) =>
          renderDayCell(d.getDate(), d.getMonth(), d.getFullYear(), 'min-h-[130px]')
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

  // ── Drag overlay ghost ───────────────────────────────────────────────────
  const activeDragData = activeId
    ? activeId.startsWith('event-')
      ? { label: events.find(e => String(e.id) === activeId.replace('event-', ''))?.title || '…', color: 'bg-[var(--primary)]/60 text-black' }
      : { label: posts.find(p => String(p.id) === activeId.replace('post-', ''))?.concept_title || '…', color: 'bg-[var(--surface-highest)] text-gray-200' }
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="surface-card p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={prevPeriod} className="p-1 text-gray-500 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm font-mono font-black text-white uppercase tracking-widest">
              {headerLabel}
            </span>
            <span className={`text-[10px] font-mono font-black px-2 py-1 uppercase ${mode === 'strategy' ? 'bg-[var(--secondary)] text-black' : 'bg-[var(--primary)] text-white'}`}>
              {mode === 'strategy' ? 'MAPA' : 'SEÑAL'}
            </span>
            {mode === 'strategy' && (
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest hidden md:inline">
                Click celda · Anclar evento
              </span>
            )}
            <div className="flex border border-[var(--outline-variant)] overflow-hidden">
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

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] font-mono font-black text-gray-600 uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        {calMode === 'month' ? renderMonth() : renderWeek()}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--outline-variant)]">
          {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 ${cls.split(' ')[0]}`} />
              <span className="text-[9px] font-mono text-gray-500 uppercase">{cat}</span>
            </div>
          ))}
          {(onMoveEvent || onMovePost) && (
            <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest ml-auto">
              ↔ Drag para mover
            </span>
          )}
        </div>
      </div>

      {/* Drag ghost overlay */}
      <DragOverlay>
        {activeDragData && (
          <div className={`px-2 py-1 text-[9px] font-mono font-black shadow-2xl opacity-90 ${activeDragData.color}`}>
            {truncate(activeDragData.label, 20)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default CalendarView;
