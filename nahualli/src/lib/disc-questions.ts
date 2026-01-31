export interface DISCQuestion {
  id: number
  text: string
  dimension: 'dominance' | 'influence' | 'steadiness' | 'conscientiousness'
  reversed: boolean
}

export const DISC_QUESTIONS: DISCQuestion[] = [
  // Dominance (D) - 5 questions
  { id: 1, text: "I enjoy taking charge of situations.", dimension: 'dominance', reversed: false },
  { id: 2, text: "I prefer others to make decisions.", dimension: 'dominance', reversed: true },
  { id: 3, text: "I am direct and to the point.", dimension: 'dominance', reversed: false },
  { id: 4, text: "I avoid confrontation.", dimension: 'dominance', reversed: true },
  { id: 5, text: "I thrive on competition.", dimension: 'dominance', reversed: false },

  // Influence (I) - 5 questions
  { id: 6, text: "I enjoy meeting new people.", dimension: 'influence', reversed: false },
  { id: 7, text: "I prefer working alone.", dimension: 'influence', reversed: true },
  { id: 8, text: "I am enthusiastic and optimistic.", dimension: 'influence', reversed: false },
  { id: 9, text: "I find small talk difficult.", dimension: 'influence', reversed: true },
  { id: 10, text: "I easily persuade others.", dimension: 'influence', reversed: false },

  // Steadiness (S) - 5 questions
  { id: 11, text: "I prefer a stable, predictable environment.", dimension: 'steadiness', reversed: false },
  { id: 12, text: "I enjoy rapid change.", dimension: 'steadiness', reversed: true },
  { id: 13, text: "I am patient with others.", dimension: 'steadiness', reversed: false },
  { id: 14, text: "I get impatient easily.", dimension: 'steadiness', reversed: true },
  { id: 15, text: "I am a good listener.", dimension: 'steadiness', reversed: false },

  // Conscientiousness (C) - 5 questions
  { id: 16, text: "I focus on accuracy and quality.", dimension: 'conscientiousness', reversed: false },
  { id: 17, text: "I often overlook details.", dimension: 'conscientiousness', reversed: true },
  { id: 18, text: "I follow rules and procedures.", dimension: 'conscientiousness', reversed: false },
  { id: 19, text: "I prefer to improvise.", dimension: 'conscientiousness', reversed: true },
  { id: 20, text: "I analyze situations carefully before acting.", dimension: 'conscientiousness', reversed: false },
]

export interface DISCResult {
  dominance: number
  influence: number
  steadiness: number
  conscientiousness: number
}

export function calculateDISCScores(answers: Record<number, number>): DISCResult {
  const dimensionScores: Record<string, number[]> = {
    dominance: [],
    influence: [],
    steadiness: [],
    conscientiousness: [],
  }

  DISC_QUESTIONS.forEach((q) => {
    const answer = answers[q.id]
    if (answer !== undefined) {
      const score = q.reversed ? (6 - answer) : answer
      dimensionScores[q.dimension].push(score)
    }
  })

  const calculateScore = (scores: number[]): number => {
    if (scores.length === 0) return 0
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round((avg / 5) * 100)
  }

  return {
    dominance: calculateScore(dimensionScores.dominance),
    influence: calculateScore(dimensionScores.influence),
    steadiness: calculateScore(dimensionScores.steadiness),
    conscientiousness: calculateScore(dimensionScores.conscientiousness),
  }
}

export function getDISCLabel(dimension: keyof DISCResult): string {
  const labels: Record<keyof DISCResult, string> = {
    dominance: 'Dominance (D)',
    influence: 'Influence (I)',
    steadiness: 'Steadiness (S)',
    conscientiousness: 'Conscientiousness (C)',
  }
  return labels[dimension]
}

export function getDISCDescription(dimension: keyof DISCResult, score: number): string {
  const high = score >= 70
  const low = score < 40
  
  const descriptions: Record<keyof DISCResult, { high: string; mid: string; low: string }> = {
    dominance: {
      high: "You're results-oriented, decisive, and enjoy challenges.",
      mid: "You balance assertiveness with collaboration.",
      low: "You prefer cooperation over competition and value harmony.",
    },
    influence: {
      high: "You're outgoing, enthusiastic, and enjoy inspiring others.",
      mid: "You balance social engagement with focused work.",
      low: "You prefer substance over style and value depth in relationships.",
    },
    steadiness: {
      high: "You're patient, reliable, and value stability.",
      mid: "You adapt well to both stable and changing environments.",
      low: "You embrace change and enjoy variety in your work.",
    },
    conscientiousness: {
      high: "You're analytical, detail-oriented, and value accuracy.",
      mid: "You balance attention to detail with practical action.",
      low: "You prefer quick decisions over extensive analysis.",
    },
  }

  if (high) return descriptions[dimension].high
  if (low) return descriptions[dimension].low
  return descriptions[dimension].mid
}

export function getDISCProfile(result: DISCResult): string {
  const sorted = Object.entries(result)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key[0].toUpperCase())
  
  return sorted.slice(0, 2).join('')
}
