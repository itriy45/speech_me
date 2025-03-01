import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="absolute -top-16 left-0 right-0 p-3 bg-red-50 text-red-600 
      text-sm border border-red-200 rounded-lg shadow-sm animate-fade-in">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
    </div>
  );
}