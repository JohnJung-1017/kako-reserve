import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';

interface Props {
  allDates: string[];
  keywordDates: string[];
  currentDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export default function ChatCalendar({ allDates, keywordDates, currentDate, onDateSelect, onClose }: Props) {
  const dateSet = new Set(allDates);
  const keywordSet = new Set(keywordDates);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (keywordSet.has(dateStr)) return 'has-messages has-keyword';
    if (dateSet.has(dateStr)) return 'has-messages';
    return null;
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !dateSet.has(dateStr);
  };

  const handleChange = (value: unknown) => {
    if (value instanceof Date) {
      const dateStr = format(value, 'yyyy-MM-dd');
      if (dateSet.has(dateStr)) {
        onDateSelect(dateStr);
        onClose();
      }
    }
  };

  const initialDate = currentDate ? new Date(currentDate) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-4 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">날짜 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 범례 */}
        <div className="flex gap-4 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fee500] inline-block" />
            대화 있는 날
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            키워드 일치
          </div>
        </div>

        <Calendar
          onChange={handleChange}
          value={initialDate}
          tileClassName={tileClassName}
          tileDisabled={tileDisabled}
          locale="ko-KR"
          calendarType="gregory"
        />
      </div>
    </div>
  );
}
