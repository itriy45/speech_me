import React, { useRef, useEffect } from 'react';
import DialogueMessage from './DialogueMessage';
import TypingIndicator from './TypingIndicator';
import { useDialogueContext } from '../../context/dialogue';
import { Message } from '../../types/dialogue';
interface DialogueBoxProps {
  messages: Message[];
  attempts: number;
}
export default function DialogueBox({ messages, attempts }: DialogueBoxProps) {
  const { state } = useDialogueContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: behavior
      });
    }
  };
  // Scroll on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);
  // Initial scroll and resize handler
  useEffect(() => {
    const handleResize = () => scrollToBottom('auto');
    window.addEventListener('resize', handleResize);
    scrollToBottom('auto');

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{
        height: 'calc(100vh - 140px)',    // Adjusted for removed main header
        paddingBottom: '180px',           // Significantly increased padding
        paddingTop: '80px',              // Added space for dialogue header
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message) => (
          <DialogueMessage key={message.id} message={message} />
        ))}
        {state.isTyping && <TypingIndicator />}
        <div 
          ref={messagesEndRef} 
          style={{ height: '32px' }}      // Increased bottom spacer
          className="mb-"               // Additional margin bottom
        />
      </div>
    </div>
  );
}