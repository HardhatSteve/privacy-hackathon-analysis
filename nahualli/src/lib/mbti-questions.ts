export interface MBTIQuestion {
  id: number
  text: string
  dimension: 'EI' | 'SN' | 'TF' | 'JP'
  pole: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
}

export const MBTI_QUESTIONS: MBTIQuestion[] = [
  // Extraversion vs Introversion (E/I) - 5 questions
  { id: 1, text: "I feel energized after spending time with a group of people.", dimension: 'EI', pole: 'E' },
  { id: 2, text: "I need time alone to recharge after social events.", dimension: 'EI', pole: 'I' },
  { id: 3, text: "I prefer to think out loud with others.", dimension: 'EI', pole: 'E' },
  { id: 4, text: "I prefer to process my thoughts internally before sharing.", dimension: 'EI', pole: 'I' },
  { id: 5, text: "I enjoy being the center of attention.", dimension: 'EI', pole: 'E' },

  // Sensing vs Intuition (S/N) - 5 questions
  { id: 6, text: "I focus on concrete facts and details.", dimension: 'SN', pole: 'S' },
  { id: 7, text: "I enjoy exploring abstract theories and possibilities.", dimension: 'SN', pole: 'N' },
  { id: 8, text: "I trust my direct experience over hunches.", dimension: 'SN', pole: 'S' },
  { id: 9, text: "I often see patterns and connections others miss.", dimension: 'SN', pole: 'N' },
  { id: 10, text: "I prefer practical, hands-on learning.", dimension: 'SN', pole: 'S' },

  // Thinking vs Feeling (T/F) - 5 questions
  { id: 11, text: "I make decisions based on logic and objective analysis.", dimension: 'TF', pole: 'T' },
  { id: 12, text: "I consider how decisions will affect people's feelings.", dimension: 'TF', pole: 'F' },
  { id: 13, text: "I value fairness and consistency over harmony.", dimension: 'TF', pole: 'T' },
  { id: 14, text: "I prioritize maintaining positive relationships.", dimension: 'TF', pole: 'F' },
  { id: 15, text: "I can easily critique ideas without taking it personally.", dimension: 'TF', pole: 'T' },

  // Judging vs Perceiving (J/P) - 5 questions
  { id: 16, text: "I prefer to have a clear plan before starting.", dimension: 'JP', pole: 'J' },
  { id: 17, text: "I enjoy keeping my options open.", dimension: 'JP', pole: 'P' },
  { id: 18, text: "I feel satisfied when tasks are completed.", dimension: 'JP', pole: 'J' },
  { id: 19, text: "I work best under pressure near deadlines.", dimension: 'JP', pole: 'P' },
  { id: 20, text: "I like to organize my environment.", dimension: 'JP', pole: 'J' },
]

export interface MBTIResult {
  extraversion: number  // 0-100, >50 = E, <50 = I
  intuition: number     // 0-100, >50 = N, <50 = S
  feeling: number       // 0-100, >50 = F, <50 = T
  perceiving: number    // 0-100, >50 = P, <50 = J
}

export function calculateMBTIScores(answers: Record<number, number>): MBTIResult {
  const scores = {
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0,
  }
  const counts = { EI: 0, SN: 0, TF: 0, JP: 0 }

  MBTI_QUESTIONS.forEach((q) => {
    const answer = answers[q.id]
    if (answer !== undefined) {
      scores[q.pole] += answer
      counts[q.dimension]++
    }
  })

  const calculateDimensionScore = (pole2: keyof typeof scores, count: number): number => {
    if (count === 0) return 50
    const maxPossible = count * 5
    return Math.round((scores[pole2] / maxPossible) * 100)
  }

  return {
    extraversion: 100 - calculateDimensionScore('E', counts.EI),
    intuition: calculateDimensionScore('N', counts.SN),
    feeling: calculateDimensionScore('F', counts.TF),
    perceiving: calculateDimensionScore('P', counts.JP),
  }
}

export function getMBTIType(result: MBTIResult): string {
  const e = result.extraversion >= 50 ? 'E' : 'I'
  const n = result.intuition >= 50 ? 'N' : 'S'
  const f = result.feeling >= 50 ? 'F' : 'T'
  const p = result.perceiving >= 50 ? 'P' : 'J'
  return `${e}${n}${f}${p}`
}

export function getMBTILabel(dimension: keyof MBTIResult): string {
  const labels: Record<keyof MBTIResult, string> = {
    extraversion: 'Extraversion (E) vs Introversion (I)',
    intuition: 'Intuition (N) vs Sensing (S)',
    feeling: 'Feeling (F) vs Thinking (T)',
    perceiving: 'Perceiving (P) vs Judging (J)',
  }
  return labels[dimension]
}

export function getMBTIDescription(dimension: keyof MBTIResult, score: number): string {
  const descriptions: Record<keyof MBTIResult, { high: string; low: string }> = {
    extraversion: {
      high: "You're energized by external interaction and think out loud.",
      low: "You're energized by solitude and prefer internal reflection.",
    },
    intuition: {
      high: "You focus on patterns, possibilities, and the big picture.",
      low: "You focus on concrete facts, details, and practical reality.",
    },
    feeling: {
      high: "You prioritize values, harmony, and how decisions affect people.",
      low: "You prioritize logic, consistency, and objective analysis.",
    },
    perceiving: {
      high: "You prefer flexibility, spontaneity, and keeping options open.",
      low: "You prefer structure, planning, and decisive action.",
    },
  }

  return score >= 50 ? descriptions[dimension].high : descriptions[dimension].low
}

export const MBTI_TYPE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'INTJ': { name: 'The Architect', description: 'Strategic, independent, and determined planners.' },
  'INTP': { name: 'The Logician', description: 'Innovative inventors with an unquenchable thirst for knowledge.' },
  'ENTJ': { name: 'The Commander', description: 'Bold, imaginative, and strong-willed leaders.' },
  'ENTP': { name: 'The Debater', description: 'Smart and curious thinkers who love intellectual challenges.' },
  'INFJ': { name: 'The Advocate', description: 'Quiet and mystical, yet inspiring and tireless idealists.' },
  'INFP': { name: 'The Mediator', description: 'Poetic, kind, and altruistic, always eager to help.' },
  'ENFJ': { name: 'The Protagonist', description: 'Charismatic and inspiring leaders who mesmerize their listeners.' },
  'ENFP': { name: 'The Campaigner', description: 'Enthusiastic, creative, and sociable free spirits.' },
  'ISTJ': { name: 'The Logistician', description: 'Practical and fact-minded, reliable and dutiful.' },
  'ISFJ': { name: 'The Defender', description: 'Dedicated and warm protectors, always ready to defend loved ones.' },
  'ESTJ': { name: 'The Executive', description: 'Excellent administrators, unsurpassed at managing things or people.' },
  'ESFJ': { name: 'The Consul', description: 'Extraordinarily caring, social, and popular, always eager to help.' },
  'ISTP': { name: 'The Virtuoso', description: 'Bold and practical experimenters, masters of tools.' },
  'ISFP': { name: 'The Adventurer', description: 'Flexible and charming artists, always ready to explore.' },
  'ESTP': { name: 'The Entrepreneur', description: 'Smart, energetic, and perceptive, living on the edge.' },
  'ESFP': { name: 'The Entertainer', description: 'Spontaneous, energetic, and enthusiastic entertainers.' },
}
