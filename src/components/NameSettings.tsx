import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import type { AppSettings } from '../types';

export default function NameSettings() {
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
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (
    user: 'userA' | 'userB',
    field: 'kakaoName' | 'displayName' | 'email',
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [user]: { ...prev[user], [field]: value } }));
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-base font-bold text-gray-800 mb-4">사용자 이름 설정</h2>

      {(['userA', 'userB'] as const).map((key) => (
        <div key={key} className="mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            {key === 'userA' ? '사용자 A (관리자)' : '사용자 B'}
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">이메일</label>
              <input
                type="email"
                value={form[key].email}
                onChange={(e) => updateField(key, 'email', e.target.value)}
                placeholder="로그인 이메일"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fee500]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">카카오톡 파일 내 이름 (정확히 일치)</label>
              <input
                type="text"
                value={form[key].kakaoName}
                onChange={(e) => updateField(key, 'kakaoName', e.target.value)}
                placeholder="예: 정일형"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fee500]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">화면에 표시될 이름</label>
              <input
                type="text"
                value={form[key].displayName}
                onChange={(e) => updateField(key, 'displayName', e.target.value)}
                placeholder="예: 일형"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#fee500]"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-[#fee500] text-[#381e1f] font-bold rounded-xl text-sm hover:bg-[#fdd800] active:scale-95 transition-all disabled:opacity-60"
      >
        {saved ? '저장 완료!' : saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  );
}
