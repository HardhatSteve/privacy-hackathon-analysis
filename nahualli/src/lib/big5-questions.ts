export interface Question {
  id: number
  text: string
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'
  reversed: boolean
}

export const BIG5_QUESTIONS: Question[] = [
  // Openness (O) - 5 questions
  { id: 1, text: "I have a vivid imagination.", trait: 'openness', reversed: false },
  { id: 2, text: "I am not interested in abstract ideas.", trait: 'openness', reversed: true },
  { id: 3, text: "I enjoy thinking about new and unusual ideas.", trait: 'openness', reversed: false },
  { id: 4, text: "I prefer routine over variety.", trait: 'openness', reversed: true },
  { id: 5, text: "I am curious about many different things.", trait: 'openness', reversed: false },

  // Conscientiousness (C) - 5 questions
  { id: 6, text: "I am always prepared.", trait: 'conscientiousness', reversed: false },
  { id: 7, text: "I often forget to put things back in their proper place.", trait: 'conscientiousness', reversed: true },
  { id: 8, text: "I pay attention to details.", trait: 'conscientiousness', reversed: false },
  { id: 9, text: "I make a mess of things.", trait: 'conscientiousness', reversed: true },
  { id: 10, text: "I get chores done right away.", trait: 'conscientiousness', reversed: false },

  // Extraversion (E) - 5 questions
  { id: 11, text: "I am the life of the party.", trait: 'extraversion', reversed: false },
  { id: 12, text: "I don't talk a lot.", trait: 'extraversion', reversed: true },
  { id: 13, text: "I feel comfortable around people.", trait: 'extraversion', reversed: false },
  { id: 14, text: "I keep in the background.", trait: 'extraversion', reversed: true },
  { id: 15, text: "I start conversations.", trait: 'extraversion', reversed: false },

  // Agreeableness (A) - 5 questions
  { id: 16, text: "I am interested in people.", trait: 'agreeableness', reversed: false },
  { id: 17, text: "I insult people.", trait: 'agreeableness', reversed: true },
  { id: 18, text: "I sympathize with others' feelings.", trait: 'agreeableness', reversed: false },
  { id: 19, text: "I am not interested in other people's problems.", trait: 'agreeableness', reversed: true },
  { id: 20, text: "I have a soft heart.", trait: 'agreeableness', reversed: false },

  // Neuroticism (N) - 5 questions
  { id: 21, text: "I get stressed out easily.", trait: 'neuroticism', reversed: false },
  { id: 22, text: "I am relaxed most of the time.", trait: 'neuroticism', reversed: true },
  { id: 23, text: "I worry about things.", trait: 'neuroticism', reversed: false },
  { id: 24, text: "I seldom feel blue.", trait: 'neuroticism', reversed: true },
  { id: 25, text: "I get upset easily.", trait: 'neuroticism', reversed: false },
]

export interface TestResult {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export function calculateScores(answers: Record<number, number>): TestResult {
  const traitScores: Record<string, number[]> = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: [],
  }

  BIG5_QUESTIONS.forEach((q) => {
    const answer = answers[q.id]
    if (answer !== undefined) {
      const score = q.reversed ? (6 - answer) : answer
      traitScores[q.trait].push(score)
    }
  })

  const calculateTraitScore = (scores: number[]): number => {
    if (scores.length === 0) return 0
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round((avg / 5) * 100)
  }

  return {
    openness: calculateTraitScore(traitScores.openness),
    conscientiousness: calculateTraitScore(traitScores.conscientiousness),
    extraversion: calculateTraitScore(traitScores.extraversion),
    agreeableness: calculateTraitScore(traitScores.agreeableness),
    neuroticism: calculateTraitScore(traitScores.neuroticism),
  }
}

export function getTraitLabel(trait: keyof TestResult): string {
  const labels: Record<keyof TestResult, string> = {
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Neuroticism',
  }
  return labels[trait]
}

export function getTraitDescription(trait: keyof TestResult, score: number): string {
  const high = score >= 70
  const low = score < 40
  
  const descriptions: Record<keyof TestResult, { high: string; mid: string; low: string }> = {
    openness: {
      high: "You're highly creative, curious, and open to new experiences.",
      mid: "You balance practicality with openness to new ideas.",
      low: "You prefer routine and practical approaches over abstract thinking.",
    },
    conscientiousness: {
      high: "You're highly organized, disciplined, and goal-oriented.",
      mid: "You balance flexibility with organization in your approach.",
      low: "You prefer spontaneity and flexibility over strict planning.",
    },
    extraversion: {
      high: "You're energized by social interaction and enjoy being around others.",
      mid: "You're comfortable in both social and solitary situations.",
      low: "You prefer quieter environments and deeper one-on-one connections.",
    },
    agreeableness: {
      high: "You're highly cooperative, trusting, and empathetic.",
      mid: "You balance cooperation with healthy skepticism.",
      low: "You're more competitive and skeptical in your approach.",
    },
    neuroticism: {
      high: "You tend to experience emotional fluctuations and stress more intensely.",
      mid: "You have a balanced emotional response to life's challenges.",
      low: "You're emotionally stable and resilient under pressure.",
    },
  }

  if (high) return descriptions[trait].high
  if (low) return descriptions[trait].low
  return descriptions[trait].mid
}
