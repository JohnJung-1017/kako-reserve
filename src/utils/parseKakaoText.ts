import type { DayChat, KakaoMessage } from '../types';

const DATE_SEPARATOR = /^-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*\S+요일\s*-+$/;
const MESSAGE_LINE = /^\[(.+?)\]\s*\[(.+?)\]\s*([\s\S]*)$/;

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

export function parseKakaoText(text: string): DayChat[] {
  const lines = text.split('\n');
  const result: Map<string, KakaoMessage[]> = new Map();

  let currentDate = '';
  let currentMessage: KakaoMessage | null = null;

  const flushMessage = () => {
    if (currentDate && currentMessage) {
      const messages = result.get(currentDate) || [];
      messages.push({ ...currentMessage, content: currentMessage.content.trimEnd() });
      result.set(currentDate, messages);
      currentMessage = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    // 날짜 구분선
    const dateMatch = line.match(DATE_SEPARATOR);
    if (dateMatch) {
      flushMessage();
      const [, year, month, day] = dateMatch;
      currentDate = `${year}-${padZero(Number(month))}-${padZero(Number(day))}`;
      continue;
    }

    if (!currentDate) continue;

    // 새 메시지 라인
    const msgMatch = line.match(MESSAGE_LINE);
    if (msgMatch) {
      flushMessage();
      const [, sender, time, content] = msgMatch;
      currentMessage = { sender: sender.trim(), time: time.trim(), content: content.trim() };
      continue;
    }

    // 멀티라인 메시지 이어붙임
    if (currentMessage && line.trim() !== '') {
      currentMessage.content += '\n' + line;
      continue;
    }

    // 빈 줄 – 현재 메시지가 있으면 줄바꿈 추가
    if (currentMessage && line.trim() === '') {
      currentMessage.content += '\n';
    }
  }

  flushMessage();

  return Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, messages]) => ({ date, messages }));
}
