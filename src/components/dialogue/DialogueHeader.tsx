import React, { useRef } from 'react';
import { ArrowLeft, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DialogueHeaderProps {
  title: string;
  progress: number;
}

export default function DialogueHeader({ title, progress }: DialogueHeaderProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleBackClick = () => {
    dialogRef.current?.showModal();
  };

  const handleStay = () => {
    dialogRef.current?.close();
  };

  const handleLeave = () => {
    dialogRef.current?.close();
    navigate(-1);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-300 z-20">
      <div className="max-w-3xl mx-auto px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-indigo-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-indigo-700 transition-colors duration-200" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-700" />
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span className="truncate">{title}</span>
                <span>{progress}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 m-0 rounded-xl shadow-md bg-white w-80 backdrop:bg-black/20 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current.close();
          }
        }}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-indigo-700" />
            </div>
            <h2 className="text-lg font-medium text-indigo-900">Leave Dialogue?</h2>
            <p className="text-sm text-gray-600">
              Your progress will not be saved if you leave now
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={handleStay}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Stay
            </button>
            <button
              onClick={handleLeave}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 active:scale-95"
            >
              Leave
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}