'use client';

import { useState } from 'react';
import { X, Shield, AlertTriangle, ChevronRight, Trophy, Target, Zap, Crosshair, ArrowLeft } from 'lucide-react';
import { HunterGame } from './HunterGame';

/**
 * CypherTraining - Training Hub with game selection
 */

interface CypherTrainingProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

interface Question {
  scenario: string;
  answer: 'SAFE' | 'DOXXED';
  explain: string;
}

const QUESTIONS: Question[] = [
  {
    scenario: "You withdraw SOL directly from Binance to your main DeFi wallet.",
    answer: 'DOXXED',
    explain: "CEXs have your KYC (Passport/ID). This link permanently connects your DeFi history to your real name.",
  },
  {
    scenario: "You use a public RPC endpoint without a VPN.",
    answer: 'DOXXED',
    explain: "Public RPC nodes can log your IP address and Geo-Location. Use Helius or Quicknode via backend or VPN.",
  },
  {
    scenario: "You route your transaction through a Zero-Knowledge (ZK) protocol like Elusiv or Light.",
    answer: 'SAFE',
    explain: "ZK Proofs mathematically prove validity without revealing transaction data. This is true encryption.",
  },
  {
    scenario: "You collect a POAP NFT for attending an event in New York.",
    answer: 'DOXXED',
    explain: "POAPs prove your physical location at a specific time. Easy to correlate with flight data or social media.",
  },
  {
    scenario: "You use Privacy Cash to break the link between your wallets.",
    answer: 'SAFE',
    explain: "Tools like Privacy Cash or Radr Labs effectively break the on-chain graph history.",
  },
];

type GameMode = 'menu' | 'quiz' | 'hunter';
type QuizState = 'start' | 'playing' | 'feedback' | 'end';

export function CypherTraining({ isOpen, onClose, darkMode }: CypherTrainingProps) {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [quizState, setQuizState] = useState<QuizState>('start');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; answer: 'SAFE' | 'DOXXED' } | null>(null);
  const [shakeCard, setShakeCard] = useState(false);

  const handleAnswer = (answer: 'SAFE' | 'DOXXED') => {
    const isCorrect = answer === QUESTIONS[currentQuestion].answer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
    }
    
    setLastAnswer({ correct: isCorrect, answer });
    setQuizState('feedback');
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 >= QUESTIONS.length) {
      setQuizState('end');
    } else {
      setCurrentQuestion(prev => prev + 1);
      setLastAnswer(null);
      setQuizState('playing');
    }
  };

  const restartQuiz = () => {
    setQuizState('start');
    setCurrentQuestion(0);
    setScore(0);
    setLastAnswer(null);
  };

  const backToMenu = () => {
    setGameMode('menu');
    restartQuiz();
  };

  const getRank = () => {
    const percentage = (score / QUESTIONS.length) * 100;
    if (percentage >= 100) return { title: 'Shadow Operative', emoji: '🥷' };
    if (percentage >= 80) return { title: 'Cypherpunk Elite', emoji: '🔐' };
    if (percentage >= 60) return { title: 'Junior Agent', emoji: '🕵️' };
    if (percentage >= 40) return { title: 'Rookie', emoji: '👤' };
    return { title: 'Exposed Civilian', emoji: '🎯' };
  };

  if (!isOpen) return null;

  // Show Hunter Game
  if (gameMode === 'hunter') {
    return <HunterGame isOpen={true} onClose={backToMenu} darkMode={darkMode} />;
  }

  const textColor = darkMode ? 'text-white' : 'text-black';
  const textMuted = darkMode ? 'text-white/50' : 'text-black/50';
  const cardBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${darkMode ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`absolute top-6 right-6 z-10 p-3 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} transition-colors`}
      >
        <X className={`w-5 h-5 ${textColor}`} />
      </button>

      {/* Back Button (when in quiz) */}
      {gameMode === 'quiz' && (
        <button 
          onClick={backToMenu}
          className={`absolute top-6 left-6 z-10 p-3 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} transition-colors`}
        >
          <ArrowLeft className={`w-5 h-5 ${textColor}`} />
        </button>
      )}

      {/* GAME SELECTION MENU */}
      {gameMode === 'menu' && (
        <div className={`relative z-10 text-center max-w-2xl px-6 ${textColor}`}>
          <h1 className="text-4xl font-black mb-2 tracking-tight">CYPHERPUNK TRAINING</h1>
          <p className={`text-lg mb-10 ${textMuted}`}>Select your training module</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quiz Option */}
            <button
              onClick={() => { setGameMode('quiz'); setQuizState('start'); }}
              className={`p-8 rounded-2xl border-2 transition-all text-left ${darkMode 
                ? 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10' 
                : 'bg-black/5 border-black/10 hover:border-black/30 hover:bg-black/10'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold mb-2">DOXXED or SAFE?</h2>
              <p className={`text-sm ${textMuted}`}>
                Test your privacy instincts. Quick decisions on real-world scenarios.
              </p>
              <div className={`mt-4 text-xs ${textMuted}`}>5 scenarios • 2 min</div>
            </button>

            {/* Hunter Option */}
            <button
              onClick={() => setGameMode('hunter')}
              className="p-8 rounded-2xl border-2 transition-all text-left bg-green-500/10 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/20"
            >
              <div className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center bg-green-500/20">
                <Crosshair className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-green-500">HUNTER MODE</h2>
              <p className={`text-sm ${darkMode ? 'text-green-500/60' : 'text-green-700/60'}`}>
                Become the analyst. Find privacy flaws in transaction graphs.
              </p>
              <div className={`mt-4 text-xs ${darkMode ? 'text-green-500/40' : 'text-green-700/40'}`}>3 cases • 3 min</div>
            </button>
          </div>
        </div>
      )}

      {/* QUIZ: START SCREEN */}
      {gameMode === 'quiz' && quizState === 'start' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${darkMode ? 'bg-white/10' : 'bg-black/10'} flex items-center justify-center`}>
            <Target className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">DOXXED or SAFE?</h1>
          <p className={`text-sm mb-8 ${textMuted} max-w-sm mx-auto`}>
            Test your privacy instincts. Quick decisions. No second chances. 
            Can you spot the surveillance traps?
          </p>
          <button
            onClick={() => setQuizState('playing')}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${darkMode 
              ? 'bg-white text-black hover:bg-white/90' 
              : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <span className="flex items-center gap-3">
              <Zap className="w-5 h-5" />
              START SIMULATION
            </span>
          </button>
        </div>
      )}

      {/* QUIZ: PLAYING / FEEDBACK SCREEN */}
      {gameMode === 'quiz' && (quizState === 'playing' || quizState === 'feedback') && (
        <div className={`relative z-10 w-full max-w-xl px-6 ${textColor}`}>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-mono ${textMuted}`}>
                INTEL {currentQuestion + 1}/{QUESTIONS.length}
              </span>
              <span className={`text-xs font-mono ${textMuted}`}>
                SCORE: {score}
              </span>
            </div>
            <div className={`h-1 rounded-full ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div 
            className={`rounded-2xl border p-8 mb-6 transition-all duration-300 ${cardBg} ${shakeCard ? 'animate-shake' : ''} ${
              quizState === 'feedback' 
                ? lastAnswer?.correct 
                  ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black' 
                  : 'ring-2 ring-red-500 ring-offset-2 ring-offset-black'
                : ''
            }`}
          >
            <div className={`text-xs font-mono mb-4 ${textMuted} uppercase tracking-wider`}>
              ⌘ Classified Scenario
            </div>
            <p className="text-xl font-medium leading-relaxed mb-6">
              "{QUESTIONS[currentQuestion].scenario}"
            </p>

            {/* Feedback */}
            {quizState === 'feedback' && lastAnswer && (
              <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                <div className={`flex items-center gap-2 mb-3 ${lastAnswer.correct ? 'text-emerald-500' : 'text-red-500'}`}>
                  {lastAnswer.correct ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="font-bold">
                    {lastAnswer.correct ? 'CORRECT!' : 'WRONG!'}
                  </span>
                  <span className={`text-sm ${textMuted}`}>
                    — Answer was {QUESTIONS[currentQuestion].answer}
                  </span>
                </div>
                <p className={`text-sm ${textMuted} leading-relaxed`}>
                  {QUESTIONS[currentQuestion].explain}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {quizState === 'playing' ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer('DOXXED')}
                className="flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg bg-red-500/20 text-red-500 border-2 border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-all"
              >
                <AlertTriangle className="w-6 h-6" />
                DOXXED
              </button>
              <button
                onClick={() => handleAnswer('SAFE')}
                className="flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all"
              >
                <Shield className="w-6 h-6" />
                SAFE
              </button>
            </div>
          ) : (
            <button
              onClick={nextQuestion}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${darkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {currentQuestion + 1 >= QUESTIONS.length ? 'VIEW RESULTS' : 'NEXT INTEL'}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* QUIZ: END SCREEN */}
      {gameMode === 'quiz' && quizState === 'end' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className="text-6xl mb-4">{getRank().emoji}</div>
          <h1 className="text-3xl font-bold mb-2">{getRank().title}</h1>
          <p className={`text-5xl font-bold font-mono my-6`}>
            {score}/{QUESTIONS.length}
          </p>
          
          {/* Score Bar */}
          <div className={`w-full h-3 rounded-full mb-8 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                score === QUESTIONS.length ? 'bg-emerald-500' :
                score >= QUESTIONS.length * 0.6 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${(score / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <p className={`text-sm mb-8 ${textMuted}`}>
            {score === QUESTIONS.length 
              ? "Perfect! You're a true cypherpunk." 
              : score >= QUESTIONS.length * 0.6 
                ? "Good intuition! But there's room to improve."
                : "Your wallet might be compromised. Time to learn!"}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={restartQuiz}
              className={`px-8 py-4 rounded-2xl font-bold transition-all ${darkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <span className="flex items-center justify-center gap-3">
                <Trophy className="w-5 h-5" />
                TRY AGAIN
              </span>
            </button>
            <button
              onClick={backToMenu}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all ${darkMode 
                ? 'bg-white/10 hover:bg-white/20' 
                : 'bg-black/10 hover:bg-black/20'
              }`}
            >
              Back to Training Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
