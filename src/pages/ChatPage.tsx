import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import type { KakaoMessage } from '../types';
import MessageBubble from '../components/MessageBubble';
import DateNavigator from '../components/DateNavigator';
import ChatCalendar from '../components/ChatCalendar';
import KeywordSearch from '../components/KeywordSearch';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const { role, settings, logout } = useAuth();
  const navigate = useNavigate();
  const [allDates, setAllDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState('');
  const [messages, setMessages] = useState<KakaoMessage[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [keywordDates, setKeywordDates] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myKakaoName = role === 'A' ? settings?.userA.kakaoName : settings?.userB.kakaoName;

  // 날짜 목록 로드
  const loadDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      // dateIndex에서 먼저 시도
      const indexSnap = await getDoc(doc(db, 'settings', 'dateIndex'));
      if (indexSnap.exists()) {
        const dates: string[] = indexSnap.data().dates || [];
        const sorted = [...dates].sort();
        setAllDates(sorted);
        if (sorted.length > 0) setCurrentDate(sorted[sorted.length - 1]);
      } else {
        // fallback: chats 컬렉션 전체 조회
        const snap = await getDocs(collection(db, 'chats'));
        const dates = snap.docs.map((d) => d.id).sort();
        setAllDates(dates);
        if (dates.length > 0) setCurrentDate(dates[dates.length - 1]);
      }
    } finally {
      setLoadingDates(false);
    }
  }, []);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  // 메시지 로드
  useEffect(() => {
    if (!currentDate) return;
    setLoadingMessages(true);
    getDoc(doc(db, 'chats', currentDate)).then((snap) => {
      if (snap.exists()) {
        setMessages(snap.data().messages || []);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    });
  }, [currentDate]);

  // 날짜 바뀔 때 최하단 스크롤
  useEffect(() => {
    if (!loadingMessages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [loadingMessages, currentDate]);

  const getDisplayName = (sender: string) => {
    if (!settings) return sender;
    if (sender === settings.userA.kakaoName) return settings.userA.displayName;
    if (sender === settings.userB.kakaoName) return settings.userB.displayName;
    return sender;
  };

  if (loadingDates) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#b2c7d9]">
        <div className="text-white/80 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (allDates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#b2c7d9] gap-4">
        <p className="text-white/80 text-sm">아직 대화 데이터가 없습니다.</p>
        {role === 'A' && (
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 bg-[#fee500] text-[#381e1f] font-bold rounded-xl text-sm"
          >
            관리자 페이지에서 파일 업로드
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#b2c7d9] max-w-lg mx-auto relative">
      {/* 상단 헤더 */}
      <div className="bg-[#3c9ac9] text-white sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#fee500] rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#381e1f]">
                <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.591 5.448 4 7.001V21l3.146-1.682A11.33 11.33 0 0012 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">
                {settings?.userA.displayName} & {settings?.userB.displayName}
              </div>
              <div className="text-white/60 text-[10px]">
                {role === 'A' ? settings?.userA.displayName : settings?.userB.displayName} 으로 로그인
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'A' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-white/70 hover:text-white p-1.5"
                title="관리자"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <button onClick={logout} className="text-white/70 hover:text-white text-xs">
              나가기
            </button>
          </div>
        </div>

        {/* 날짜 내비게이터 */}
        <DateNavigator
          currentDate={currentDate}
          allDates={allDates}
          onDateChange={setCurrentDate}
          onCalendarToggle={() => setShowCalendar(true)}
        />
      </div>

      {/* 메시지 영역 */}
      <div className="messages-container flex-1 overflow-y-auto px-3 py-4 pb-24">
        {loadingMessages ? (
          <div className="flex justify-center py-10">
            <div className="text-white/60 text-sm">불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="text-white/60 text-sm">이 날의 대화가 없습니다.</div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.sender === myKakaoName;
              const prevSender = i > 0 ? messages[i - 1].sender : null;
              const showName = !isMine && msg.sender !== prevSender;

              return (
                <MessageBubble
                  key={i}
                  message={msg}
                  isMine={isMine}
                  displayName={getDisplayName(msg.sender)}
                  showName={showName}
                  keyword={keyword || undefined}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 하단 검색 바 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-3 pt-2 safe-bottom bg-[#b2c7d9]/90 backdrop-blur z-20">
        <KeywordSearch
          keyword={keyword}
          onKeywordChange={setKeyword}
          onKeywordDatesFound={setKeywordDates}
          onDateSelect={setCurrentDate}
        />
      </div>

      {/* 달력 모달 */}
      {showCalendar && (
        <ChatCalendar
          allDates={allDates}
          keywordDates={keywordDates}
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}
