import React from 'react';
import { Mic, Send } from 'lucide-react';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { useSpeechState } from '../context/SpeechStateContext';
import ErrorMessage from './speech/ErrorMessage';
import TranscriptDisplay from './speech/TranscriptDisplay';
import { useDialogueContext } from '../context/dialogue';
import {isMobileDevice} from "../utils/deviceDetection";

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  canSkip?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
}

export default function SpeechInput({ 
  onTranscript, 
  canSkip = true,
  buttonSize = 'medium'
}: SpeechInputProps) {
  const {
    isRecording,
    error,
    currentText,
    startRecording,
    stopRecording,
    handleTextSubmit
  } = useSpeechInput({ onTranscript });

  const { state: speechState } = useSpeechState();
  const { state: dialogueState } = useDialogueContext();
  const isDisabled = speechState.isSpeaking;

  // Define size classes based on buttonSize prop
  const sizeClasses = {
    small: {
      button: 'w-12 h-12',
      icon: 'w-5 h-5',
      border: 'w-14 h-14'
    },
    medium: {
      button: 'w-16 h-16',
      icon: 'w-6 h-6',
      border: 'w-20 h-20'
    },
    large: {
      button: 'w-20 h-20',
      icon: 'w-8 h-8',
      border: 'w-24 h-24'
    }
  }[buttonSize];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-300 shadow-lg">
      <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
      
      {error && (
        <div className="absolute -top-16 left-4 right-4">
          <ErrorMessage message={error} />
        </div>
      )}
      
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="mb-4 transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <TranscriptDisplay
            text={currentText}
            onSubmit={handleTextSubmit}
            isRecording={isRecording}
            readonly={true}
          />
        </div>
        
        <div className="flex items-center justify-center gap-3">
          {/* Speech Button with Border */}
          <div className={`relative ${sizeClasses.border} flex items-center justify-center`}>
            {/* Decorative Border */}
            <div className={`
              absolute inset-0 rounded-full
              border-2 border-indigo-200
              transition-all duration-300
              ${isRecording ? 'animate-pulse' : ''}
            `} />
            
            {/* Interactive Gradient Ring */}
            <div className={`
              absolute inset-[-2px] rounded-full
              transition-all duration-300
              ${isRecording 
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 animate-spin-slow opacity-20'
                : 'bg-transparent'
              }
            `} />
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isDisabled}
              className={`
                relative ${sizeClasses.button} rounded-full
                flex items-center justify-center
                transition-all duration-300
                ${isDisabled
                  ? 'bg-gray-100 cursor-not-allowed'
                  : isRecording
                    ? 'bg-white ring-2 ring-indigo-500'
                    : 'bg-indigo-50 hover:bg-indigo-100 hover:shadow-md active:scale-95'
                }
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
                group
              `}
              aria-label={
                isDisabled 
                  ? 'Please wait' 
                  : isRecording 
                    ? 'Stop recording' 
                    : 'Start recording'
              }
            >
              <div className="relative flex items-center justify-center">
                {isRecording ? (
                  // Sound Wave Animation
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-indigo-600 animate-soundwave"
                        style={{
                          height: buttonSize === 'large' ? '24px' : '16px',
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Mic className={`
                    ${sizeClasses.icon}
                    transition-all duration-300
                    ${isDisabled 
                      ? 'text-gray-400' 
                      : 'text-indigo-700 group-hover:scale-110'
                    }
                  `} />
                )}
              </div>

              {isRecording && (
                <div className="absolute -right-1 -top-1 w-3 h-3">
                  <div className="absolute w-full h-full rounded-full bg-rose-600 animate-ping opacity-75" />
                  <div className="relative w-full h-full rounded-full bg-rose-600" />
                </div>
              )}
            </button>
          </div>

          {/* Send Button with Border - Only visible on mobile */}
          <div className={`relative ${sizeClasses.border} flex items-center justify-center hidden`}>
            {/* Decorative Border */}
            <div className={`
              absolute inset-0 rounded-full
              border-2 border-indigo-200
              transition-all duration-300
              ${currentText.trim() && (!isRecording || isMobileDevice()) ? 'border-indigo-300' : ''}
            `} />
            
            {/* Interactive Gradient Ring */}
            <div className={`
              absolute inset-[-2px] rounded-full
              transition-all duration-300
              ${currentText.trim() && (!isRecording || isMobileDevice())
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 opacity-20'
                : 'bg-transparent'
              }
            `} />
            
            <button
              onClick={handleTextSubmit}
              disabled={!currentText.trim() || (isRecording && !isMobileDevice())}
              className={`
                relative ${sizeClasses.button} rounded-full
                flex items-center justify-center
                transition-all duration-300
                ${currentText.trim() && (!isRecording || isMobileDevice())
                  ? 'bg-white hover:bg-indigo-50 hover:shadow-md active:scale-95'
                  : 'bg-gray-50 cursor-not-allowed'
                }
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
                group
              `}
              aria-label="Send message"
            >
              <Send className={`
                ${sizeClasses.icon}
                transition-all duration-300
                ${currentText.trim() && (!isRecording || isMobileDevice())
                  ? 'text-purple-700 group-hover:scale-110 group-hover:translate-x-0.5'
                  : 'text-gray-400'
                }
              `} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .animate-soundwave {
          animation: soundwave 1s ease-in-out infinite;
          border-radius: 1px;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}