export interface KakaoMessage {
  sender: string;
  time: string;
  content: string;
}

export interface DayChat {
  date: string; // YYYY-MM-DD
  messages: KakaoMessage[];
}

export interface UserSettings {
  email: string;
  kakaoName: string;
  displayName: string;
}

export interface AppSettings {
  userA: UserSettings;
  userB: UserSettings;
}

export type UserRole = 'A' | 'B' | null;
