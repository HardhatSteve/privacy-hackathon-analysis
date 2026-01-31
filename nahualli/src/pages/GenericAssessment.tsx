import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield, CheckCircle, Loader2, Lock, Send, Cpu, Sparkles } from 'lucide-react'
import { Header } from '../components/Header'
import { useEncryptedStorage } from '../hooks/useEncryptedStorage'
import { processWithArcium, type ProcessingStatus, DEMO_MODE } from '../lib/arcium'
import { generateInterpretation } from '../lib/interpretations'
import { getTestConfig, type TestType } from '../lib/tests-config'

// Big-5
import { BIG5_QUESTIONS, calculateScores as calculateBig5, getTraitLabel as getBig5Label, getTraitDescription as getBig5Desc } from '../lib/big5-questions'
import type { TestResult as Big5Result } from '../lib/big5-questions'

// DISC
import { DISC_QUESTIONS, calculateDISCScores, getDISCLabel, getDISCDescription, getDISCProfile } from '../lib/disc-questions'
import type { DISCResult } from '../lib/disc-questions'

// MBTI
import { MBTI_QUESTIONS, calculateMBTIScores, getMBTILabel, getMBTIDescription, getMBTIType, MBTI_TYPE_DESCRIPTIONS } from '../lib/mbti-questions'
import type { MBTIResult } from '../lib/mbti-questions'

// Enneagram
import { ENNEAGRAM_QUESTIONS, calculateEnneagramScores, getDominantType, getWing, ENNEAGRAM_TYPE_INFO } from '../lib/enneagram-questions'
import type { EnneagramResult } from '../lib/enneagram-questions'

type AssessmentStep = 'intro' | 'questions' | 'processing' | 'results'

interface GenericQuestion {
  id: number
  text: string
}

type AnyResult = Big5Result | DISCResult | MBTIResult | EnneagramResult

export function GenericAssessment() {
  const { testType } = useParams<{ testType: TestType }>()
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { saveTestResult } = useEncryptedStorage()
  
  const [step, setStep] = useState<AssessmentStep>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [results, setResults] = useState<AnyResult | null>(null)
  const [savedHash, setSavedHash] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle')
  const [processingMessage, setProcessingMessage] = useState<string>('')

  if (!testType || !['big5', 'disc', 'mbti', 'enneagram'].includes(testType)) {
    navigate('/tests')
    return null
  }

  const config = getTestConfig(testType as TestType)
  
  const getQuestions = (): GenericQuestion[] => {
    switch (testType) {
      case 'big5': return BIG5_QUESTIONS
      case 'disc': return DISC_QUESTIONS
      case 'mbti': return MBTI_QUESTIONS
      case 'enneagram': return ENNEAGRAM_QUESTIONS
      default: return []
    }
  }

  const questions = getQuestions()

  const calculateResults = (ans: Record<number, number>): AnyResult => {
    switch (testType) {
      case 'big5': return calculateBig5(ans)
      case 'disc': return calculateDISCScores(ans)
      case 'mbti': return calculateMBTIScores(ans)
      case 'enneagram': return calculateEnneagramScores(ans)
      default: return {} as AnyResult
    }
  }

  const handleAnswer = async (value: number) => {
    const question = questions[currentQuestion]
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      const scores = calculateResults(newAnswers)
      setResults(scores)
      setStep('processing')
      
      const walletAddress = publicKey?.toBase58() || 'anonymous'
      
      // Convert scores to Big5-compatible format for Arcium processing
      const scoresForArcium = convertToArciumFormat(scores, testType as TestType)
      
      await processWithArcium(
        scoresForArcium as Big5Result,
        walletAddress,
        (status, message) => {
          setProcessingStatus(status)
          setProcessingMessage(message || '')
        }
      )
      
      // Generate and store interpretation based on test type
      const interpretation = generateInterpretation(testType as string, scores)
      localStorage.setItem(`nahualli_interpretation_${walletAddress}`, JSON.stringify(interpretation))
      
      const stored = await saveTestResult(testType as TestType, newAnswers, scores)
      if (stored) {
        setSavedHash(stored.ipfsHash)
      }
      
      setStep('results')
    }
  }

  const convertToArciumFormat = (scores: AnyResult, type: TestType): Big5Result => {
    // Convert any test result to Big5-compatible format for generic processing
    switch (type) {
      case 'big5':
        return scores as Big5Result
      case 'disc': {
        const disc = scores as DISCResult
        return {
          openness: disc.influence,
          conscientiousness: disc.conscientiousness,
          extraversion: disc.dominance,
          agreeableness: disc.steadiness,
          neuroticism: 50, // neutral
        }
      }
      case 'mbti': {
        const mbti = scores as MBTIResult
        return {
          openness: mbti.intuition,
          conscientiousness: 100 - mbti.perceiving,
          extraversion: mbti.extraversion,
          agreeableness: mbti.feeling,
          neuroticism: 50,
        }
      }
      case 'enneagram': {
        const enn = scores as EnneagramResult
        return {
          openness: enn.type7,
          conscientiousness: enn.type1,
          extraversion: enn.type3,
          agreeableness: enn.type2,
          neuroticism: enn.type6,
        }
      }
      default:
        return { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 }
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (!connected) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center">
          <Shield className="w-16 h-16 mx-auto text-teal mb-6" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-brown-light max-w-md mx-auto">
            To take the assessment and own your results on-chain, please connect your Solana wallet first.
          </p>
        </div>
      </div>
    )
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">{config.icon}</div>
          <h1 className="font-serif text-4xl font-bold text-brown mb-4">
            {config.name}
          </h1>
          <p className="text-brown-light mb-8">
            {config.description}
          </p>
          
          <div className="bg-cream-dark/50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-brown mb-3">What to expect:</h3>
            <ul className="space-y-2 text-brown-light text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span>{config.questionCount} questions about your personality and preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span>Takes approximately {config.estimatedTime} to complete</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span>Results are encrypted and stored on Solana</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span>Processed confidentially using Arcium MXE</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              to="/tests"
              className="border-2 border-brown text-brown px-6 py-3 rounded-full font-semibold hover:bg-brown hover:text-cream transition-colors"
            >
              Back to Tests
            </Link>
            <button
              onClick={() => setStep('questions')}
              className="bg-brown text-cream px-8 py-3 rounded-full font-semibold hover:bg-brown-light transition-colors"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'questions') {
    const question = questions[currentQuestion]
    const currentAnswer = answers[question.id]

    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-28 px-6 max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-brown-light mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <p className="text-xl text-brown font-medium text-center mb-8">
              {question.text}
            </p>

            <div className="space-y-3">
              {[
                { value: 1, label: 'Strongly Disagree' },
                { value: 2, label: 'Disagree' },
                { value: 3, label: 'Neutral' },
                { value: 4, label: 'Agree' },
                { value: 5, label: 'Strongly Agree' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    currentAnswer === option.value
                      ? 'border-teal bg-teal/10 text-brown'
                      : 'border-cream-dark hover:border-teal/50 text-brown-light hover:text-brown'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 text-brown-light hover:text-brown disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={() => currentAnswer && handleAnswer(currentAnswer)}
              disabled={!currentAnswer}
              className="flex items-center gap-2 text-brown-light hover:text-brown disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'processing') {
    const steps = [
      { id: 'encrypting', label: 'Encrypting data', icon: Lock },
      { id: 'submitting', label: 'Submitting to Solana', icon: Send },
      { id: 'processing', label: 'Arcium MXE processing', icon: Cpu },
      { id: 'complete', label: 'Complete', icon: Sparkles },
    ]

    const currentStepIndex = steps.findIndex(s => s.id === processingStatus)

    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-teal/10 rounded-full flex items-center justify-center">
            {processingStatus === 'complete' ? (
              <Sparkles className="w-10 h-10 text-teal" />
            ) : (
              <Loader2 className="w-10 h-10 text-teal animate-spin" />
            )}
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-brown mb-2">
            {processingStatus === 'complete' ? 'Processing Complete!' : 'Confidential Processing'}
          </h1>
          <p className="text-brown-light mb-8">
            {processingMessage || 'Your data is being processed securely...'}
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-left">
            <div className="space-y-4">
              {steps.map((s, index) => {
                const Icon = s.icon
                const isActive = s.id === processingStatus
                const isComplete = index < currentStepIndex || processingStatus === 'complete'
                
                return (
                  <div 
                    key={s.id}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isActive ? 'bg-teal/10' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-teal text-white' : 
                      isActive ? 'bg-teal/20 text-teal' : 
                      'bg-cream-dark text-brown-light'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      isActive || isComplete ? 'text-brown' : 'text-brown-light'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {DEMO_MODE && (
            <p className="text-xs text-brown-light/50 mt-6">
              Demo mode: accelerated processing for demonstration
            </p>
          )}
        </div>
      </div>
    )
  }

  if (step === 'results' && results) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-28 px-6 max-w-3xl mx-auto pb-16">
          <div className="text-center mb-12">
            <CheckCircle className="w-16 h-16 mx-auto text-teal mb-4" />
            <h1 className="font-serif text-4xl font-bold text-brown mb-2">
              Your {config.shortName} Results
            </h1>
            <p className="text-brown-light">
              Your personality profile has been encrypted and stored.
            </p>
            {savedHash && (
              <p className="text-xs text-brown-light/60 mt-2 font-mono">
                ID: {savedHash.slice(0, 20)}...
              </p>
            )}
          </div>

          {renderResults()}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link 
              to="/proofs"
              className="bg-brown text-cream px-8 py-4 rounded-full font-semibold hover:bg-brown-light transition-colors text-center"
            >
              Generate ZK Proof
            </Link>
            <Link 
              to="/tests"
              className="border-2 border-brown text-brown px-8 py-4 rounded-full font-semibold hover:bg-brown hover:text-cream transition-colors text-center"
            >
              Take Another Test
            </Link>
          </div>
        </div>
      </div>
    )
  }

  function renderResults() {
    if (!results) return null

    switch (testType) {
      case 'big5': {
        const big5 = results as Big5Result
        const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const
        return (
          <div className="space-y-6">
            {traits.map((trait) => (
              <div key={trait} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif text-xl font-semibold text-brown">
                    {getBig5Label(trait)}
                  </h3>
                  <span className="text-2xl font-bold text-teal">
                    {big5[trait]}%
                  </span>
                </div>
                <div className="h-3 bg-cream-dark rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${big5[trait]}%` }}
                  />
                </div>
                <p className="text-brown-light text-sm">
                  {getBig5Desc(trait, big5[trait])}
                </p>
              </div>
            ))}
          </div>
        )
      }

      case 'disc': {
        const disc = results as DISCResult
        const profile = getDISCProfile(disc)
        const dimensions = ['dominance', 'influence', 'steadiness', 'conscientiousness'] as const
        return (
          <div className="space-y-6">
            <div className="bg-teal/10 rounded-2xl p-6 text-center">
              <p className="text-brown-light text-sm mb-2">Your DISC Profile</p>
              <p className="text-4xl font-bold text-teal">{profile}</p>
            </div>
            {dimensions.map((dim) => (
              <div key={dim} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif text-xl font-semibold text-brown">
                    {getDISCLabel(dim)}
                  </h3>
                  <span className="text-2xl font-bold text-teal">
                    {disc[dim]}%
                  </span>
                </div>
                <div className="h-3 bg-cream-dark rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${disc[dim]}%` }}
                  />
                </div>
                <p className="text-brown-light text-sm">
                  {getDISCDescription(dim, disc[dim])}
                </p>
              </div>
            ))}
          </div>
        )
      }

      case 'mbti': {
        const mbti = results as MBTIResult
        const type = getMBTIType(mbti)
        const typeInfo = MBTI_TYPE_DESCRIPTIONS[type]
        const dimensions = ['extraversion', 'intuition', 'feeling', 'perceiving'] as const
        return (
          <div className="space-y-6">
            <div className="bg-teal/10 rounded-2xl p-6 text-center">
              <p className="text-brown-light text-sm mb-2">Your MBTI Type</p>
              <p className="text-4xl font-bold text-teal mb-2">{type}</p>
              {typeInfo && (
                <>
                  <p className="text-lg font-semibold text-brown">{typeInfo.name}</p>
                  <p className="text-brown-light text-sm mt-2">{typeInfo.description}</p>
                </>
              )}
            </div>
            {dimensions.map((dim) => (
              <div key={dim} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif text-lg font-semibold text-brown">
                    {getMBTILabel(dim)}
                  </h3>
                  <span className="text-xl font-bold text-teal">
                    {mbti[dim]}%
                  </span>
                </div>
                <div className="h-3 bg-cream-dark rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${mbti[dim]}%` }}
                  />
                </div>
                <p className="text-brown-light text-sm">
                  {getMBTIDescription(dim, mbti[dim])}
                </p>
              </div>
            ))}
          </div>
        )
      }

      case 'enneagram': {
        const enn = results as EnneagramResult
        const dominant = getDominantType(enn)
        const wing = getWing(enn)
        const typeInfo = ENNEAGRAM_TYPE_INFO[dominant]
        const types = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
        return (
          <div className="space-y-6">
            <div className="bg-teal/10 rounded-2xl p-6 text-center">
              <p className="text-brown-light text-sm mb-2">Your Enneagram Type</p>
              <p className="text-4xl font-bold text-teal mb-2">{wing}</p>
              <p className="text-lg font-semibold text-brown">{typeInfo.name}</p>
              <p className="text-brown-light text-sm mt-2">{typeInfo.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-left text-sm">
                <div>
                  <p className="text-brown-light">Core Fear:</p>
                  <p className="text-brown">{typeInfo.fear}</p>
                </div>
                <div>
                  <p className="text-brown-light">Core Desire:</p>
                  <p className="text-brown">{typeInfo.desire}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-serif text-lg font-semibold text-brown mb-4">All Types</h3>
              <div className="space-y-3">
                {types.map((t) => {
                  const key = `type${t}` as keyof EnneagramResult
                  const score = enn[key]
                  return (
                    <div key={t} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-brown-light">Type {t}</span>
                      <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${t === dominant ? 'bg-teal' : 'bg-teal/50'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right text-sm ${t === dominant ? 'font-bold text-teal' : 'text-brown-light'}`}>
                        {score}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return null
}
