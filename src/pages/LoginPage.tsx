import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 오류입니다. 인터넷 연결을 확인해주세요.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Firebase 이메일/비밀번호 로그인이 비활성화되어 있습니다.\nFirebase Console → Authentication → Sign-in method에서 활성화해주세요.';
    case 'auth/unauthorized-domain':
      return '이 도메인이 Firebase 승인 도메인에 등록되어 있지 않습니다.\nFirebase Console → Authentication → Settings → 승인된 도메인에 추가해주세요.';
    default:
      return `로그인 오류: ${code}`;
  }
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? 'unknown';
      setError(getFirebaseErrorMessage(code));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#b2c7d9]">
      <div className="w-full max-w-sm px-6">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#fee500] rounded-[28px] flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#381e1f]">
              <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.591 5.448 4 7.001V21l3.146-1.682A11.33 11.33 0 0012 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow">KakaoTalk Viewer</h1>
          <p className="text-white/70 text-sm mt-1">대화를 되돌아보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#fee500] text-sm"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#fee500] text-sm"
          />

          {error && (
            <div className="bg-red-100/80 border border-red-300 rounded-xl px-4 py-3">
              <p className="text-red-700 text-xs whitespace-pre-wrap leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#fee500] text-[#381e1f] font-bold rounded-xl text-sm hover:bg-[#fdd800] active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
