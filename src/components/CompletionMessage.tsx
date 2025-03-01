import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, BarChart2, ArrowRight, Share2, Clock, HelpCircle, Star, Hash, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { dialogueCategories } from '../data/dialogueCategories';
import { useHistoryContext } from '../context/HistoryContext';
import { saveCompletedDialogue, saveLearnedWords } from '../utils/storage';
import { formatDuration } from '../utils/timeUtils';

interface CompletionMessageProps {
  dialogueTitle: string;
  wordsSpoken: number;
  categoryId: string;
  dialogueId: string;
  isLastInCategory: boolean;
  startTime: number;
  endTime: number;
  learnedWords: Set<string>;
  hintsUsed: number;
}

export default function CompletionMessage({
  dialogueTitle,
  wordsSpoken,
  categoryId,
  dialogueId,
  isLastInCategory,
  startTime,
  endTime,
  learnedWords,
  hintsUsed,
}: CompletionMessageProps) {
  const navigate = useNavigate();
  const { dispatch } = useHistoryContext();
  const dailyGoal = 400;
  const progressToGoal = Math.min((wordsSpoken / dailyGoal) * 100, 100);
  const duration = endTime - startTime;
  const formattedDuration = formatDuration(duration);

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hashtag, setHashtag] = useState('');
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState(1); // 1: rating, 2: hashtag & feedback, 3: Google Form
  const [showGoogleForm, setShowGoogleForm] = useState(false);

  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdYNuEc_Tz5b8aU-W2karZ5RpryrK_xN1jpOiiHPbV7KYyQrA/viewform?embedded=true'; // Replace with your actual Google Form URL

  const handleShare = async () => {
    setShowRating(true);
  };

  const handleNextStep = () => {
    if (step === 2) {
      handleSubmitShare();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmitShare = async () => {
    const feedbackSection = feedback ? `💭 Feedback: "${feedback}"\n` : '';
    const hashtagSection = hashtag ? `#${hashtag.replace(/^#/, '')}` : '';
    
    const shareText = `🎉 I just completed "${dialogueTitle}"!\n\n` +
      `⭐ My rating: ${rating}/5 stars\n` +
      `⏱️ Time: ${formattedDuration}\n` +
      `🗣️ Words spoken: ${wordsSpoken}\n` +
      `💡 Hints used: ${hintsUsed}\n` +
      `🎯 Daily goal: ${wordsSpoken}/${dailyGoal} words\n` +
      feedbackSection +
      `\n 🏥\n` +
      `\n\n` +
      hashtagSection;

    try {
      await navigator.clipboard.writeText(shareText);
      showNotification('📋 Achievement copied! Now you can paste it into the form! 💜');
      setShowGoogleForm(true);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showNotification('❌ Unable to copy achievement');
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleCloseGoogleForm = () => {
    setShowGoogleForm(false);
    setShowRating(false);
    setStep(1);
  };

  useEffect(() => {
    const completedAt = new Date();
    saveCompletedDialogue(dialogueId, completedAt);
    saveLearnedWords(Array.from(learnedWords));
    dispatch({
      type: 'MARK_COMPLETED',
      payload: { dialogueId, completedAt }
    });
  }, [dialogueId, dispatch, learnedWords]);

  const handleBack = () => {
    navigate(`/dialogues`, { 
      state: { selectedCategory: categoryId }
    });
  };

  const handleContinue = () => {
    if (isLastInCategory) {
      navigate(`/dialogues`, {
        state: {
          selectedCategory: categoryId,
          completionMessage: "🎉 You've completed all dialogues in this category!"
        }
      });
    } else {
      const category = dialogueCategories.find(c => c.id === categoryId);
      if (category) {
        const currentIndex = category.dialogues.indexOf(dialogueId);
        const nextDialogueId = category.dialogues[currentIndex + 1];
        if (nextDialogueId) {
          navigate(`/practice/${categoryId}/${nextDialogueId}`, {
            replace: true
          });
        }
      }
    }
  };

  const renderGoogleFormStep = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl h-[80vh] relative">
        <button
          onClick={handleCloseGoogleForm}
          className="absolute top-4 right-4 text-gray-500 hover:text-indigo-700"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="h-full">
          <iframe
            src={GOOGLE_FORM_URL}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );

  const renderRatingStep = () => (
    <>
      <h3 className="text-xl font-bold text-center mb-4 text-indigo-900">
        How useful was this dialogue? ⭐
      </h3>
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowRating(false)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleNextStep}
          disabled={!rating}
          className={`px-4 py-2 rounded-lg transition-all ${
            rating
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </>
  );

  const renderHashtagAndFeedbackStep = () => (
    <>
      <h3 className="text-xl font-bold text-center mb-4 text-indigo-900">
        Add Your Personal Touch ✨
      </h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Your Unique Hashtag
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="Enter your hashtag"
              className="pl-9 w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Your Feedback (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts about this dialogue..."
              className="pl-9 w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 outline-none resize-none h-24"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handlePrevStep}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!hashtag}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            hashtag
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Submit & Open Form
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
      {showGoogleForm ? (
        renderGoogleFormStep()
      ) : showRating ? (
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-scale-up">
          {step === 1 ? renderRatingStep() : renderHashtagAndFeedbackStep()}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-scale-up relative overflow-hidden">
          {/* Success banner */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white py-3 px-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-base font-medium">Dialogue Completed!</span>
            </div>
            <div className="absolute inset-0 bg-white/10 transform -skew-y-12 translate-y-full animate-slide-up"></div>
          </div>
          
          <div className="mt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Trophy className={`w-12 h-12 ${wordsSpoken >= dailyGoal ? 'text-yellow-500' : 'text-indigo-700'}`} />
                <div className="absolute -top-2 -right-2">
                  <BarChart2 className="w-6 h-6 text-indigo-700 animate-bounce" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 text-indigo-900">
              Great job! 🎉
            </h2>
            
            <p className="text-gray-600 text-center mb-4 text-sm">
              You've completed "{dialogueTitle}"
            </p>

            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-2">
                  <Clock className="w-5 h-5 text-indigo-700 mb-1" />
                  <span className="text-sm text-gray-600">Time</span>
                  <span className="font-bold text-indigo-900">{formattedDuration}</span>
                </div>
                
                <div className="flex flex-col items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-2">
                  <BarChart2 className="w-5 h-5 text-indigo-700 mb-1" />
                  <span className="text-sm text-gray-600">Words</span>
                  <span className="font-bold text-indigo-900">{wordsSpoken}</span>
                </div>

                <div className="flex flex-col items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-2">
                  <HelpCircle className="w-5 h-5 text-purple-700 mb-1" />
                  <span className="text-sm text-gray-600">Hints</span>
                  <span className="font-bold text-purple-700">{hintsUsed}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-700">Daily Progress</span>
                  <span className="text-sm font-semibold text-indigo-900">
                    {wordsSpoken}/{dailyGoal} words
                  </span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressToGoal}%` }}
                  />
                </div>
                {wordsSpoken >= dailyGoal && (
                  <div className="text-sm text-emerald-600 font-medium text-center">
                    🎯 Daily goal achieved!
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleShare}
                className="py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 
                  hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white rounded-lg text-sm font-medium
                  transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1"
              >
                Share
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleBack}
                className="py-2 px-3 bg-gray-100 text-gray-500 hover:text-indigo-700 rounded-lg text-sm font-medium
                  hover:bg-gray-200 transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 
                  hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 text-white rounded-lg text-sm font-medium
                  transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1"
              >
                {isLastInCategory ? 'Done' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {isLastInCategory && (
              <div className="mt-6 text-sm text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 
                  bg-gradient-to-r from-purple-50 to-indigo-50 
                  text-purple-700 rounded-full border border-indigo-100
                  shadow-md animate-bounce-gentle">
                  <Trophy className="w-5 h-5 text-purple-700" />
                  <span className="font-semibold">Category completed! 🎉</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}