import { Instagram } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  ArrowRight, 
  Mic, 
  BookOpen, 
  CheckCircle, 
  ArrowUpCircle,
  Volume2,
  Languages,
  GraduationCap,
  Brain,
  FileText,
  MessageCircle
} from 'lucide-react';

// Keep all existing animation constants
const ANIMATION_SPEEDS = {
  FAST: {
    BOUNCE: 800,
    PULSE: 500,
    RIPPLE: 800,
    WAVE: 400,
    WAVE_DELAY: 50
  },
  MEDIUM: {
    BOUNCE: 1250,
    PULSE: 1000,
    RIPPLE: 1500,
    WAVE: 800,
    WAVE_DELAY: 100
  },
  SLOW: {
    BOUNCE: 2000,
    PULSE: 1800,
    RIPPLE: 2000,
    WAVE: 1500,
    WAVE_DELAY: 200
  }
};

const CURRENT_SPEED = ANIMATION_SPEEDS.MEDIUM;

const EnhancedMicrophone = () => {
  return (
    <div className="relative p-6 md:p-8 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="relative z-20">
        <Mic 
          className="h-12 w-12 md:h-14 md:w-14 text-indigo-700 animate-bounce" 
          style={{ 
            animationDuration: `${CURRENT_SPEED.BOUNCE}ms`,
            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }} 
        />
      </div>

      <div className="absolute inset-0 z-10">
        <div 
          className="absolute inset-2 rounded-full bg-indigo-100 animate-pulse opacity-40"
          style={{ animationDuration: `${CURRENT_SPEED.PULSE}ms` }}
        ></div>
        
        <div 
          className="absolute -inset-2 rounded-full border-2 border-indigo-200 animate-ping opacity-20"
          style={{ animationDuration: `${CURRENT_SPEED.RIPPLE}ms` }}
        ></div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 flex justify-center gap-1.5 pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1 md:w-1.5 bg-indigo-500 rounded-full opacity-60"
            style={{
              height: '16px',
              animation: `wave ${CURRENT_SPEED.WAVE}ms ease-in-out infinite`,
              animationDelay: `${(i - 1) * CURRENT_SPEED.WAVE_DELAY}ms`,
              '@keyframes wave': {
                '0%, 100%': { transform: 'scaleY(0.3)' },
                '50%': { transform: 'scaleY(1)' }
              }
            }}
          ></div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-purple-50 to-indigo-100 rounded-full opacity-50 blur-sm"></div>
    </div>
  );
};

export default function Practice() {
  const navigate = useNavigate();
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Languages className="h-6 w-6 md:h-7 md:w-7 text-indigo-700" />,
      title: "Професійні діалоги",
      description: "Реальні сценарії спілкування з пацієнтами та колегами",
      bgColor: "bg-indigo-50",
      hoverColor: "group-hover:bg-indigo-100"
    },
    {
      icon: <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-purple-700" />,
      title: "Миттєвий feedback",
      description: "Моментальна перевірка перекладу та вимови для впевненого спілкування медичною англійською",
      bgColor: "bg-purple-50",
      hoverColor: "group-hover:bg-purple-100"
    },
    {
      icon: <Brain className="h-6 w-6 md:h-7 md:w-7 text-indigo-700" />,
      title: "Комплексний підхід",
      description: "Розвивайте всі мовленнєві навички одночасно",
      bgColor: "bg-indigo-50",
      hoverColor: "group-hover:bg-indigo-100"
    },
    {
      icon: <Volume2 className="h-6 w-6 md:h-7 md:w-7 text-purple-700" />,
      title: "Практика розмовної мови",
      description: "Формуйте реальні розмовні навички замість простого проходження тестів. Вчіться спілкуватися у життєвих ситуаціях",
      bgColor: "bg-purple-50",
      hoverColor: "group-hover:bg-purple-100"
    }
  ];

  const steps = [
    {
      icon: <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-indigo-700" />,
      title: "Оберіть діалог",
      description: "Виберіть категорію та тему медичного діалогу",
      bgColor: "bg-indigo-50",
      hoverColor: "group-hover:bg-indigo-100"
    },
    {
      icon: <Mic className="h-6 w-6 md:h-7 md:w-7 text-purple-700" />,
      title: "Практикуйте",
      description: "Перекладайте та вимовляйте фрази, отримуйте миттєвий зворотній зв'язок",
      bgColor: "bg-purple-50",
      hoverColor: "group-hover:bg-purple-100"
    },
    {
      icon: <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-indigo-700" />,
      title: "Вдосконалюйтеся",
      description: "Покращуйте 5 ключових навичок щодня: говоріння, аудіювання, читання, граматику та правильну вимову",
      bgColor: "bg-indigo-50",
      hoverColor: "group-hover:bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Quick Start Section */}
        <div className="mb-12 lg:mb-16">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-12 mb-8">
                <EnhancedMicrophone />
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 text-indigo-900">Speak Medical English 🇬🇧</h2>
                  <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-3xl">
                    Практикуйте реальні діалоги, покращуйте вимову та збагачуйте словниковий запас
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-6">
                <button
                  onClick={() => navigate('/dialogues')}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-lg py-3 px-6 lg:py-4 lg:px-8
                    flex items-center justify-center gap-2 hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-800 
                    transition-all duration-300 shadow-md hover:shadow-lg group font-medium text-base lg:text-lg"
                >
                  Почати навчання
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-4 text-sm lg:text-base">
                  <a
                    href="https://bootcampmd.notion.site/Code-Black-Academy-18797a63d28a8055826edf97da16d688?pvs=4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="border-b border-dotted border-gray-300 hover:border-indigo-700">
                      Інструкція
                    </span>
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href="https://forms.gle/zpXiqMSKxNJ8uCQz8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="border-b border-dotted border-gray-300 hover:border-indigo-700">
                      Відгук
                    </span>
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href="https://www.instagram.com/codeblack.ua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-700 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <Instagram className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform" />
                    <span className="border-b border-dotted border-gray-300 group-hover:border-indigo-700">
                      IG
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="mb-12 lg:mb-16">
          <div className="flex justify-center mb-8 lg:mb-12">
            <div className="inline-flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 rounded-2xl bg-white shadow-sm">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-900">Як це працює? 🤔</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="group bg-white rounded-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col items-start">
                  <div className={`p-3 lg:p-4 ${step.bgColor} rounded-lg mb-4 lg:mb-6 ${step.hoverColor} transition-colors duration-300`}>
                    {step.icon}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-indigo-900">{step.title}</h3>
                  <p className="text-gray-600 text-base lg:text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <div className="flex justify-center mb-8 lg:mb-12">
            <div className="inline-flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 rounded-2xl bg-white shadow-sm">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-900">Особливості додатку ✨</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className={`p-3 lg:p-4 ${feature.bgColor} rounded-lg ${feature.hoverColor} transition-colors duration-300`}>
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-indigo-900">{feature.title}</h3>
                    <p className="text-gray-600 text-base lg:text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-3 rounded-full shadow-lg 
            hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 hover:shadow-xl active:scale-95"
          aria-label="Прокрутити вгору"
        >
          <ArrowUpCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}