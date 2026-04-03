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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const myKakaoName = role === 'A' ? settings?.userA.kakaoName : settings?.userB.kakaoName;

  const loadDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      const indexSnap = await getDoc(doc(db, 'settings', 'dateIndex'));
      if (indexSnap.exists()) {
        const dates: string[] = indexSnap.data().dates || [];
        const sorted = [...dates].sort();
        setAllDates(sorted);
        if (sorted.length > 0) setCurrentDate(sorted[sorted.length - 1]);
      } else {
        const snap = await getDocs(collection(db, 'chats'));
        const dates = snap.docs.map((d) => d.id).sort();
        setAllDates(dates);
        if (dates.length > 0) setCurrentDate(dates[dates.length - 1]);
      }
    } finally {
      setLoadingDates(false);
    }
  }, []);

  useEffect(() => { loadDates(); }, [loadDates]);

  useEffect(() => {
    if (!currentDate) return;
    setLoadingMessages(true);
    getDoc(doc(db, 'chats', currentDate)).then((snap) => {
      setMessages(snap.exists() ? snap.data().messages || [] : []);
      setLoadingMessages(false);
    });
  }, [currentDate]);

  useEffect(() => {
    if (!loadingMessages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-white/70 text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (allDates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#b2c7d9] gap-4 p-6">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-white font-semibold">아직 대화 데이터가 없습니다</p>
        <p className="text-white/60 text-sm text-center">관리자 페이지에서 카카오톡 텍스트 파일을 업로드해주세요</p>
        {role === 'A' && (
          <button
            onClick={() => navigate('/admin')}
            className="mt-2 px-6 py-3 bg-[#fee500] text-[#381e1f] font-bold rounded-2xl text-sm shadow-lg hover:bg-[#fdd800] active:scale-95 transition-all"
          >
            관리자 페이지 이동
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#b2c7d9] flex items-center justify-center p-3 md:p-6">
      {/* 채팅 카드 컨테이너 */}
      <div className="w-full max-w-lg h-[88vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">

        {/* ── 헤더 영역 (고정) ── */}
        <div className="flex-shrink-0 bg-[#3c9ac9]">

          {/* 앱 바 */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#fee500] rounded-xl flex items-center justify-center shadow">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#381e1f]">
                  <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.591 5.448 4 7.001V21l3.146-1.682A11.33 11.33 0 0012 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  {settings?.userA.displayName} &amp; {settings?.userB.displayName}
                </div>
                <div className="text-white/50 text-[10px]">
                  {role === 'A' ? settings?.userA.displayName : settings?.userB.displayName} 으로 열람 중
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {role === 'A' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/15 text-white/70 hover:text-white transition-all"
                  title="관리자"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button
                onClick={logout}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/15 text-white/70 hover:text-white transition-all"
                title="로그아웃"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* 날짜 내비게이터 */}
          <div className="border-t border-white/10">
            <DateNavigator
              currentDate={currentDate}
              allDates={allDates}
              onDateChange={setCurrentDate}
              onCalendarToggle={() => setShowCalendar(true)}
            />
          </div>

          {/* 키워드 검색 */}
          <div className="px-3 pb-3 pt-2">
            <KeywordSearch
              keyword={keyword}
              onKeywordChange={setKeyword}
              onKeywordDatesFound={setKeywordDates}
              onDateSelect={(date) => { setCurrentDate(date); }}
            />
          </div>
        </div>

        {/* ── 채팅 메시지 영역 (독립 스크롤) ── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-[#c8dce6] px-3 py-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-400/30 border-t-gray-500 rounded-full animate-spin" />
                <span className="text-gray-500 text-xs">불러오는 중...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400 text-sm">이 날의 대화가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {messages.map((msg, i) => {
                const isMine = msg.sender === myKakaoName;
                const prevSender = i > 0 ? messages[i - 1].sender : null;
                const nextSender = i < messages.length - 1 ? messages[i + 1].sender : null;
                const showName = !isMine && msg.sender !== prevSender;
                const isLastInGroup = msg.sender !== nextSender;

                return (
                  <MessageBubble
                    key={i}
                    message={msg}
                    isMine={isMine}
                    displayName={getDisplayName(msg.sender)}
                    showName={showName}
                    isLastInGroup={isLastInGroup}
                    keyword={keyword || undefined}
                  />
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>
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
