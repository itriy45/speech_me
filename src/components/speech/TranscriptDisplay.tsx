import React, { useEffect, useRef } from 'react';
import { useDialogueContext } from '../../context/dialogue';
import SkipButton from '../SkipButton';

interface TranscriptDisplayProps {
  text: string;
  onSubmit: () => void;
  isRecording: boolean;
  readonly?: boolean;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  text,
  onSubmit,
  isRecording,
  readonly = false
}) => {
  const displayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { state, handleSkip } = useDialogueContext();

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="relative group">
      {/* Main container with padding-right to accommodate skip button */}
      <div
        ref={displayRef}
        className={`
          min-h-16 max-h-32
          overflow-y-auto
          transition-all duration-500 ease-in-out
          pr-12 sm:pr-14
          ${isRecording ? 'recording-active' : 'inactive'}
        `}
      >
        <div
          ref={contentRef}
          className={`
            min-h-16
            flex items-start
            p-2
            transition-all duration-500 ease-in-out
            w-full
          `}
        >
          {!text && !isRecording ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-lg transition-opacity duration-300 hidden md:block text-center px-4">
                Натисніть Space для запису та надсилання тексту
              </span>
              <span className="text-gray-400 text-lg transition-opacity duration-300 block md:hidden text-center px-4">
                Натисніть на мікрофон, щоб надати відповідь...
              </span>
            </div>
          ) : (
            <div className={`
              w-full
              text-lg leading-relaxed
              transition-all duration-500 ease-in-out
              ${isRecording ? 'text-gray-500 recording-text' : 'text-gray-900 submitted-text'}
              ${text ? 'animate-text-appear' : ''}
            `}>
              <div className="relative inline-flex items-center break-words w-full">
                <span className="whitespace-pre-wrap transition-colors duration-500">
                  {text}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Skip Button - positioned absolutely but with proper spacing */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
        <SkipButton
          onSkip={handleSkip}
          hasAttempted={state.attempts > 0}
          disabled={isRecording || state.isSpeaking}
        />
      </div>

      <style>{`
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.5) transparent;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 5px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
          transition: background-color 0.3s ease;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.7);
        }

        .recording-active {
          background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0.05),
            rgba(59, 130, 246, 0.02) 10%,
            rgba(59, 130, 246, 0.02) 90%,
            rgba(59, 130, 246, 0.05)
          );
          box-shadow: inset 0 0 8px rgba(59, 130, 246, 0.05);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .inactive {
          background: transparent;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes textAppear {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
            filter: blur(1px);
          }
          50% {
            opacity: 0.5;
            transform: translateY(2px) scale(0.99);
            filter: blur(0.5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .animate-text-appear {
          animation: textAppear 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: left center;
        }

        .recording-text {
          transition: color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .submitted-text {
          transition: color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .whitespace-pre-wrap {
          line-height: 1.6;
          padding-top: 0.125rem;
          vertical-align: baseline;
        }
      `}</style>
    </div>
  );
};

export default TranscriptDisplay;