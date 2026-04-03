import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { parseKakaoText } from '../utils/parseKakaoText';
import { useNavigate } from 'react-router-dom';
import type { AppSettings } from '../types';

type Tab = 'upload' | 'settings';

interface UploadStatus {
  total: number;
  done: number;
  phase: 'idle' | 'parsing' | 'uploading' | 'done' | 'error';
  message: string;
}

function UploadTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>({ total: 0, done: 0, phase: 'idle', message: '' });
  const [mergeMode, setMergeMode] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file: File) => {
    setStatus({ total: 0, done: 0, phase: 'parsing', message: '파일 분석 중...' });
    try {
      const text = await file.text();
      const days = parseKakaoText(text);
      if (days.length === 0) {
        setStatus({ total: 0, done: 0, phase: 'error', message: '날짜 구분을 찾을 수 없습니다. 카카오톡 내보내기 파일인지 확인해주세요.' });
        return;
      }
      setStatus({ total: days.length, done: 0, phase: 'uploading', message: `${days.length}개 날짜 업로드 중...` });

      const CHUNK_SIZE = 400;
      let done = 0;
      for (let i = 0; i < days.length; i += CHUNK_SIZE) {
        const chunk = days.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const day of chunk) {
          const ref = doc(db, 'chats', day.date);
          batch.set(ref, { date: day.date, messages: day.messages }, mergeMode ? { merge: true } : {});
        }
        await batch.commit();
        done += chunk.length;
        setStatus((prev) => ({ ...prev, done }));
      }

      const allDates = days.map((d) => d.date);
      await setDoc(doc(db, 'settings', 'dateIndex'), { dates: allDates }, { merge: mergeMode });

      setStatus({ total: days.length, done: days.length, phase: 'done', message: `${days.length}개 날짜 저장 완료` });
    } catch (err) {
      console.error(err);
      setStatus({ total: 0, done: 0, phase: 'error', message: '업로드 중 오류가 발생했습니다.' });
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith('.txt')) await processFile(file);
  };

  const percent = status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">대화 파일 업로드</h2>
        <p className="text-sm text-gray-500 mt-1">카카오톡 내보내기(.txt) 파일을 업로드하면 날짜별로 파싱하여 Firestore에 저장합니다.</p>
      </div>

      {/* 모드 선택 */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">업로드 방식</p>
        <div className="flex gap-3">
          <button
            onClick={() => setMergeMode(true)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
              mergeMode
                ? 'border-[#fee500] bg-[#fffde7] text-[#381e1f]'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              이어서 추가
            </div>
            <p className="text-[11px] font-normal text-gray-400 mt-1">기존 데이터 유지, 새 날짜만 추가</p>
          </button>
          <button
            onClick={() => setMergeMode(false)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
              !mergeMode
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              전체 덮어쓰기
            </div>
            <p className="text-[11px] font-normal text-gray-400 mt-1">중복 날짜는 새 파일로 교체</p>
          </button>
        </div>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragOver
            ? 'border-[#fee500] bg-yellow-50'
            : status.phase === 'done'
            ? 'border-green-300 bg-green-50'
            : status.phase === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-gray-50 hover:border-[#fee500] hover:bg-yellow-50'
        } ${(status.phase === 'parsing' || status.phase === 'uploading') ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
        {status.phase === 'done' ? (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-green-700">{status.message}</p>
            <p className="text-xs text-green-500 mt-1">다른 파일을 업로드하려면 클릭하세요</p>
          </>
        ) : status.phase === 'error' ? (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-red-600">업로드 실패</p>
            <p className="text-xs text-red-400 mt-1">{status.message}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700">파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-xs text-gray-400 mt-1">카카오톡 내보내기 .txt 파일</p>
          </>
        )}
      </div>

      {/* 진행 상태 바 */}
      {(status.phase === 'parsing' || status.phase === 'uploading') && (
        <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">{status.message}</span>
            {status.phase === 'uploading' && (
              <span className="text-sm text-gray-500">{status.done} / {status.total}</span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#fee500] h-2.5 rounded-full transition-all duration-300"
              style={{ width: status.phase === 'parsing' ? '15%' : `${percent}%` }}
            />
          </div>
          {status.phase === 'uploading' && (
            <p className="text-xs text-gray-400 mt-1.5">{percent}% 완료</p>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { settings, refreshSettings } = useAuth();
  const [form, setForm] = useState<AppSettings>(() => settings ?? {
    userA: { email: '', kakaoName: '', displayName: '' },
    userB: { email: '', kakaoName: '', displayName: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await setDoc(doc(db, 'settings', 'users'), form);
    await refreshSettings();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateField = (
    user: 'userA' | 'userB',
    field: 'kakaoName' | 'displayName' | 'email',
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [user]: { ...prev[user], [field]: value } }));
  };

  const UserCard = ({ key: userKey, label, color }: { key: 'userA' | 'userB'; label: string; color: string }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-3 ${color}`}>
        <p className="text-sm font-bold text-white">{label}</p>
      </div>
      <div className="p-5 space-y-4">
        {[
          { field: 'email' as const, label: '로그인 이메일', placeholder: 'example@gmail.com', type: 'email' },
          { field: 'kakaoName' as const, label: '카카오톡 파일 내 이름', placeholder: '파일에 표시된 이름 (예: 정일형)', type: 'text' },
          { field: 'displayName' as const, label: '화면 표시 이름', placeholder: '앱에서 보여줄 이름', type: 'text' },
        ].map(({ field, label: fieldLabel, placeholder, type }) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{fieldLabel}</label>
            <input
              type={type}
              value={form[userKey][field]}
              onChange={(e) => updateField(userKey, field, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#fee500] focus:border-transparent transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">사용자 설정</h2>
        <p className="text-sm text-gray-500 mt-1">로그인 이메일과 카카오톡 파일 내 이름을 매핑합니다.</p>
      </div>

      <div className="space-y-4 mb-6">
        <UserCard key="userA" label="사용자 A (관리자)" color="bg-[#3c9ac9]" />
        <UserCard key="userB" label="사용자 B" color="bg-[#6c8ebf]" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-[#fee500] text-[#381e1f] hover:bg-[#fdd800] active:scale-[0.98]'
        } disabled:opacity-60`}
      >
        {saved ? '✓ 저장 완료!' : saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { logout, settings } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('upload');

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'upload',
      label: '파일 업로드',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: '사용자 설정',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* ── 사이드바 ── */}
      <aside className="w-56 bg-[#1e2a3a] flex flex-col flex-shrink-0">
        {/* 로고 */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#fee500] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#381e1f]">
                <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.591 5.448 4 7.001V21l3.146-1.682A11.33 11.33 0 0012 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white">KakaoViewer</p>
              <p className="text-[10px] text-white/40">관리자 패널</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? 'bg-[#fee500] text-[#1e2a3a]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* 하단: 유저 정보 + 버튼들 */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2">
            <p className="text-[11px] text-white/30 uppercase tracking-wide">로그인 계정</p>
            <p className="text-xs text-white/60 mt-0.5 truncate">{settings?.userA.displayName} (관리자)</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            대화창 보기
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── 메인 컨텐츠 ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-800">
            {tab === 'upload' ? '파일 업로드' : '사용자 설정'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {tab === 'upload'
              ? '카카오톡 내보내기 텍스트 파일을 업로드하여 Firestore에 저장합니다'
              : '로그인 계정과 카카오톡 이름을 매핑하고 표시 이름을 설정합니다'}
          </p>
        </header>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {tab === 'upload' ? <UploadTab /> : <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
