import { useState } from 'react';
import type { FormEvent } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { KakaoMessage } from '../types';

interface SearchResult {
  date: string;
  matches: { message: KakaoMessage; index: number }[];
}

interface Props {
  keyword: string;
  onKeywordChange: (kw: string) => void;
  onKeywordDatesFound: (dates: string[]) => void;
  onDateSelect: (date: string) => void;
}

export default function KeywordSearch({ keyword, onKeywordChange, onKeywordDatesFound, onDateSelect }: Props) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setResults([]);
      onKeywordDatesFound([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const snap = await getDocs(collection(db, 'chats'));
      const found: SearchResult[] = [];
      const kw = keyword.trim().toLowerCase();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const messages: KakaoMessage[] = data.messages || [];
        const matches = messages
          .map((msg, index) => ({ message: msg, index }))
          .filter(({ message }) => message.content.toLowerCase().includes(kw));
        if (matches.length > 0) found.push({ date: docSnap.id, matches });
      });

      found.sort((a, b) => a.date.localeCompare(b.date));
      setResults(found);
      onKeywordDatesFound(found.map((r) => r.date));
      setShowResults(true);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    onKeywordChange('');
    setResults([]);
    onKeywordDatesFound([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-2 bg-white/15 rounded-xl border border-white/20">
        <svg className="w-3.5 h-3.5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="키워드로 날짜 검색..."
          className="flex-1 text-xs bg-transparent outline-none text-white placeholder-white/50"
        />
        {keyword && (
          <button type="button" onClick={handleClear} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={searching}
          className="text-[11px] text-white/80 hover:text-white font-semibold disabled:opacity-50 transition-colors bg-white/10 rounded-lg px-2 py-0.5"
        >
          {searching ? '검색 중' : '검색'}
        </button>
      </form>

      {/* 검색 결과 드롭다운 (아래 방향) */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50 border border-gray-100">
          <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
            <span className="text-xs font-semibold text-gray-600">
              {results.length > 0 ? `${results.length}개 날짜에서 "${keyword}" 발견` : '검색 결과 없음'}
            </span>
            <button onClick={() => setShowResults(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {results.length === 0 ? (
            <p className="p-5 text-sm text-gray-400 text-center">일치하는 대화가 없습니다.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.date}
                onClick={() => { onDateSelect(r.date); setShowResults(false); }}
                className="w-full text-left px-4 py-3 hover:bg-yellow-50 border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{r.date}</span>
                  <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">
                    {r.matches.length}건
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate leading-relaxed">
                  {r.matches[0].message.content.slice(0, 55)}…
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
