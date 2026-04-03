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
    <div className="flex items-center justify-between px-4 py-2 bg-[#3c9ac9] text-white">
      <button
        onClick={() => hasPrev && onDateChange(sortedDates[currentIndex - 1])}
        disabled={!hasPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={onCalendarToggle}
        className="flex-1 text-center hover:bg-white/10 py-1 rounded-lg transition-all"
      >
        <span className="text-sm font-semibold">{formattedDate}</span>
        <span className="text-white/60 text-xs ml-2">({currentIndex + 1}/{sortedDates.length})</span>
      </button>

      <button
        onClick={() => hasNext && onDateChange(sortedDates[currentIndex + 1])}
        disabled={!hasNext}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
