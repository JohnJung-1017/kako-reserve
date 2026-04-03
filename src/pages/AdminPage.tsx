import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { parseKakaoText } from '../utils/parseKakaoText';
import NameSettings from '../components/NameSettings';
import { useNavigate } from 'react-router-dom';

interface UploadStatus {
  total: number;
  done: number;
  phase: 'idle' | 'parsing' | 'uploading' | 'done' | 'error';
  message: string;
}

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>({
    total: 0, done: 0, phase: 'idle', message: '',
  });
  const [mergeMode, setMergeMode] = useState(true);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setStatus({ total: 0, done: 0, phase: 'parsing', message: '파일 파싱 중...' });

    try {
      const text = await file.text();
      const days = parseKakaoText(text);

      if (days.length === 0) {
        setStatus({ total: 0, done: 0, phase: 'error', message: '파싱된 날짜가 없습니다. 파일 형식을 확인해주세요.' });
        return;
      }

      setStatus({ total: days.length, done: 0, phase: 'uploading', message: `${days.length}개 날짜 업로드 중...` });

      // Firestore writeBatch는 최대 500 ops 제한 → 날짜 단위로 청크
      const CHUNK_SIZE = 400;
      let done = 0;

      for (let i = 0; i < days.length; i += CHUNK_SIZE) {
        const chunk = days.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        for (const day of chunk) {
          const ref = doc(db, 'chats', day.date);
          if (mergeMode) {
            batch.set(ref, { date: day.date, messages: day.messages }, { merge: true });
          } else {
            batch.set(ref, { date: day.date, messages: day.messages });
          }
        }

        await batch.commit();
        done += chunk.length;
        setStatus((prev) => ({ ...prev, done }));
      }

      // 날짜 목록 인덱스 저장 (캘린더용)
      const allDates = days.map((d) => d.date);
      await setDoc(doc(db, 'settings', 'dateIndex'), { dates: allDates }, { merge: mergeMode });

      setStatus({
        total: days.length,
        done: days.length,
        phase: 'done',
        message: `${days.length}개 날짜 업로드 완료!`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ total: 0, done: 0, phase: 'error', message: '오류가 발생했습니다. 다시 시도해주세요.' });
    }
  };

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#b2c7d9]">
      {/* 상단 헤더 */}
      <div className="bg-white/20 backdrop-blur sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-bold">관리자 설정</h1>
        </div>
        <button
          onClick={logout}
          className="text-white/70 hover:text-white text-sm"
        >
          로그아웃
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* 파일 업로드 섹션 */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-base font-bold text-gray-800 mb-1">카카오톡 대화 업로드</h2>
          <p className="text-xs text-gray-500 mb-4">
            카카오톡 내보내기 텍스트 파일(.txt)을 업로드하면 날짜별로 파싱하여 저장합니다.
          </p>

          {/* 덮어쓰기 / 이어쓰기 */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setMergeMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                mergeMode
                  ? 'bg-[#fee500] border-[#fee500] text-[#381e1f]'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              이어서 추가
            </button>
            <button
              onClick={() => setMergeMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                !mergeMode
                  ? 'bg-red-400 border-red-400 text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              전체 덮어쓰기
            </button>
          </div>
          {!mergeMode && (
            <p className="text-xs text-red-500 mb-3">⚠ 전체 덮어쓰기 시 기존 데이터와 중복되는 날짜는 교체됩니다.</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={status.phase === 'parsing' || status.phase === 'uploading'}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#fee500] hover:text-[#381e1f] hover:bg-yellow-50 transition-all disabled:opacity-50"
          >
            {status.phase === 'idle' || status.phase === 'done' || status.phase === 'error'
              ? '📁 텍스트 파일 선택'
              : '처리 중...'}
          </button>

          {/* 진행 상태 */}
          {status.phase !== 'idle' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{status.message}</span>
                {status.phase === 'uploading' && <span>{status.done}/{status.total}</span>}
              </div>
              {status.phase === 'uploading' && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#fee500] h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
              {status.phase === 'done' && (
                <div className="flex items-center gap-2 text-green-600 text-xs mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  업로드 완료
                </div>
              )}
              {status.phase === 'error' && (
                <p className="text-red-500 text-xs mt-1">{status.message}</p>
              )}
            </div>
          )}
        </div>

        {/* 이름 설정 */}
        <NameSettings />
      </div>
    </div>
  );
}
