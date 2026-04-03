import type { KakaoMessage } from '../types';

interface Props {
  message: KakaoMessage;
  isMine: boolean;
  displayName: string;
  showName: boolean;
  isLastInGroup: boolean;
  keyword?: string;
}

function highlight(text: string, keyword?: string) {
  if (!keyword) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
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

const MEDIA_LABELS = ['사진', '동영상', '이모티콘', '파일', '사진 '];

export default function MessageBubble({ message, isMine, displayName, showName, isLastInGroup, keyword }: Props) {
  const isMedia = MEDIA_LABELS.some((w) => message.content.startsWith(w)) && message.content.length < 25;

  return (
    <div className={`flex items-end gap-2 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${showName ? 'mt-3' : 'mt-0.5'}`}>
      {/* 상대방 아바타 */}
      {!isMine ? (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white self-start mt-0.5 ${!showName && !isLastInGroup ? 'invisible' : ''}`}>
          {isLastInGroup || showName ? displayName.slice(0, 1) : ''}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* 발신자 이름 */}
        {!isMine && showName && (
          <span className="text-xs font-semibold text-gray-600 mb-1 ml-1">{displayName}</span>
        )}

        <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div
            className={`
              px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm
              ${isMine
                ? 'bg-[#fee500] text-[#1a1a1a] rounded-2xl rounded-br-md'
                : 'bg-white text-gray-800 rounded-2xl rounded-bl-md'
              }
              ${isMedia ? 'text-gray-400 italic text-xs' : ''}
            `}
          >
            {isMedia ? `[${message.content}]` : highlight(message.content, keyword)}
          </div>

          {/* 시간 */}
          <span className="text-[10px] text-gray-400/80 mb-1 flex-shrink-0 whitespace-nowrap">
            {message.time}
          </span>
        </div>
      </div>
    </div>
  );
}
