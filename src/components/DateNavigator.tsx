import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  currentDate: string;
  allDates: string[];
  onDateChange: (date: string) => void;
  onCalendarToggle: () => void;
}

export default function DateNavigator({ currentDate, allDates, onDateChange, onCalendarToggle }: Props) {
  const sortedDates = [...allDates].sort();
  const currentIndex = sortedDates.indexOf(currentDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < sortedDates.length - 1;

  const formattedDate = currentDate
    ? format(new Date(currentDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })
    : '날짜 없음';

  return (
    <div className="flex items-center gap-1 px-2 py-2">
      <button
        onClick={() => hasPrev && onDateChange(sortedDates[currentIndex - 1])}
        disabled={!hasPrev}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/15 disabled:opacity-25 transition-all flex-shrink-0 text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={onCalendarToggle}
        className="flex-1 flex items-center justify-center gap-2 hover:bg-white/10 py-2 px-3 rounded-xl transition-all group"
      >
        <svg className="w-3.5 h-3.5 text-white/60 group-hover:text-white/80 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-semibold text-white">{formattedDate}</span>
        <span className="text-white/40 text-[11px]">{currentIndex + 1}/{sortedDates.length}</span>
      </button>

      <button
        onClick={() => hasNext && onDateChange(sortedDates[currentIndex + 1])}
        disabled={!hasNext}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/15 disabled:opacity-25 transition-all flex-shrink-0 text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
