import type { KakaoMessage } from '../types';

interface Props {
  message: KakaoMessage;
  isMine: boolean;
  displayName: string;
  showName: boolean;
  keyword?: string;
}

function highlight(text: string, keyword?: string) {
  if (!keyword) return <>{text}</>;
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function MessageBubble({ message, isMine, displayName, showName, keyword }: Props) {
  const isMedia = ['사진', '동영상', '이모티콘', '파일'].some((w) => message.content.includes(w) && message.content.length < 20);

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
      {/* 상대방 아바타 */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white self-start">
          {displayName.slice(0, 1)}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* 이름 (상대방, 첫 메시지만) */}
        {!isMine && showName && (
          <span className="text-xs text-gray-600 mb-1 ml-1">{displayName}</span>
        )}

        <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isMine
                ? 'bg-[#fee500] text-[#1a1a1a] rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
            } ${isMedia ? 'italic text-gray-400' : ''}`}
          >
            {isMedia ? `[${message.content}]` : highlight(message.content, keyword)}
          </div>

          {/* 시간 */}
          <span className="text-[10px] text-gray-400 mb-0.5 flex-shrink-0">{message.time}</span>
        </div>
      </div>
    </div>
  );
}
