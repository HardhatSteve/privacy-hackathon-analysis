export interface EnneagramQuestion {
  id: number
  text: string
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
}

export const ENNEAGRAM_QUESTIONS: EnneagramQuestion[] = [
  // Type 1 - The Reformer
  { id: 1, text: "I have a strong sense of right and wrong.", type: 1 },
  { id: 2, text: "I strive for perfection in everything I do.", type: 1 },
  { id: 3, text: "I often feel frustrated when things aren't done correctly.", type: 1 },

  // Type 2 - The Helper
  { id: 4, text: "I naturally focus on others' needs before my own.", type: 2 },
  { id: 5, text: "I feel valued when I can help others.", type: 2 },
  { id: 6, text: "I find it hard to say no to people.", type: 2 },

  // Type 3 - The Achiever
  { id: 7, text: "Success and achievement are very important to me.", type: 3 },
  { id: 8, text: "I adapt my image based on the situation.", type: 3 },
  { id: 9, text: "I am highly motivated by goals and recognition.", type: 3 },

  // Type 4 - The Individualist
  { id: 10, text: "I often feel different from others.", type: 4 },
  { id: 11, text: "I have deep, intense emotions.", type: 4 },
  { id: 12, text: "I value authenticity and self-expression.", type: 4 },

  // Type 5 - The Investigator
  { id: 13, text: "I need time alone to think and recharge.", type: 5 },
  { id: 14, text: "I prefer to observe before participating.", type: 5 },
  { id: 15, text: "I value knowledge and understanding deeply.", type: 5 },

  // Type 6 - The Loyalist
  { id: 16, text: "I often anticipate what could go wrong.", type: 6 },
  { id: 17, text: "Loyalty and trust are extremely important to me.", type: 6 },
  { id: 18, text: "I seek security and support from others.", type: 6 },

  // Type 7 - The Enthusiast
  { id: 19, text: "I love new experiences and adventures.", type: 7 },
  { id: 20, text: "I tend to avoid negative emotions.", type: 7 },
  { id: 21, text: "I have many interests and projects going on.", type: 7 },

  // Type 8 - The Challenger
  { id: 22, text: "I am direct and assertive in my communication.", type: 8 },
  { id: 23, text: "I don't like feeling controlled by others.", type: 8 },
  { id: 24, text: "I naturally take charge in situations.", type: 8 },

  // Type 9 - The Peacemaker
  { id: 25, text: "I avoid conflict whenever possible.", type: 9 },
  { id: 26, text: "I can see multiple perspectives easily.", type: 9 },
  { id: 27, text: "I sometimes lose myself in others' priorities.", type: 9 },
]

export interface EnneagramResult {
  type1: number
  type2: number
  type3: number
  type4: number
  type5: number
  type6: number
  type7: number
  type8: number
  type9: number
}

export function calculateEnneagramScores(answers: Record<number, number>): EnneagramResult {
  const typeScores: Record<number, number[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [],
  }

  ENNEAGRAM_QUESTIONS.forEach((q) => {
    const answer = answers[q.id]
    if (answer !== undefined) {
      typeScores[q.type].push(answer)
    }
  })

  const calculateScore = (scores: number[]): number => {
    if (scores.length === 0) return 0
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round((avg / 5) * 100)
  }

  return {
    type1: calculateScore(typeScores[1]),
    type2: calculateScore(typeScores[2]),
    type3: calculateScore(typeScores[3]),
    type4: calculateScore(typeScores[4]),
    type5: calculateScore(typeScores[5]),
    type6: calculateScore(typeScores[6]),
    type7: calculateScore(typeScores[7]),
    type8: calculateScore(typeScores[8]),
    type9: calculateScore(typeScores[9]),
  }
}

export function getDominantType(result: EnneagramResult): number {
  const entries = Object.entries(result) as [keyof EnneagramResult, number][]
  const sorted = entries.sort(([, a], [, b]) => b - a)
  return parseInt(sorted[0][0].replace('type', ''))
}

export function getWing(result: EnneagramResult): string {
  const dominant = getDominantType(result)
  const wing1 = dominant === 1 ? 9 : dominant - 1
  const wing2 = dominant === 9 ? 1 : dominant + 1
  
  const wing1Score = result[`type${wing1}` as keyof EnneagramResult]
  const wing2Score = result[`type${wing2}` as keyof EnneagramResult]
  
  const wing = wing1Score > wing2Score ? wing1 : wing2
  return `${dominant}w${wing}`
}

export const ENNEAGRAM_TYPE_INFO: Record<number, { name: string; description: string; fear: string; desire: string }> = {
  1: {
    name: 'The Reformer',
    description: 'Principled, purposeful, self-controlled, and perfectionistic.',
    fear: 'Being corrupt, evil, or defective',
    desire: 'To be good, to have integrity',
  },
  2: {
    name: 'The Helper',
    description: 'Generous, demonstrative, people-pleasing, and possessive.',
    fear: 'Being unwanted or unworthy of love',
    desire: 'To feel loved and appreciated',
  },
  3: {
    name: 'The Achiever',
    description: 'Adaptable, excelling, driven, and image-conscious.',
    fear: 'Being worthless or without value',
    desire: 'To feel valuable and worthwhile',
  },
  4: {
    name: 'The Individualist',
    description: 'Expressive, dramatic, self-absorbed, and temperamental.',
    fear: 'Having no identity or personal significance',
    desire: 'To find themselves and their significance',
  },
  5: {
    name: 'The Investigator',
    description: 'Perceptive, innovative, secretive, and isolated.',
    fear: 'Being useless, helpless, or incapable',
    desire: 'To be capable and competent',
  },
  6: {
    name: 'The Loyalist',
    description: 'Engaging, responsible, anxious, and suspicious.',
    fear: 'Being without support or guidance',
    desire: 'To have security and support',
  },
  7: {
    name: 'The Enthusiast',
    description: 'Spontaneous, versatile, acquisitive, and scattered.',
    fear: 'Being deprived or trapped in pain',
    desire: 'To be satisfied and content',
  },
  8: {
    name: 'The Challenger',
    description: 'Self-confident, decisive, willful, and confrontational.',
    fear: 'Being harmed or controlled by others',
    desire: 'To protect themselves and control their life',
  },
  9: {
    name: 'The Peacemaker',
    description: 'Receptive, reassuring, agreeable, and complacent.',
    fear: 'Loss and separation, fragmentation',
    desire: 'To have inner stability and peace of mind',
  },
}

export function getEnneagramLabel(type: keyof EnneagramResult): string {
  const num = parseInt(type.replace('type', ''))
  return `Type ${num}: ${ENNEAGRAM_TYPE_INFO[num].name}`
}

export function getEnneagramDescription(type: keyof EnneagramResult, score: number): string {
  const num = parseInt(type.replace('type', ''))
  const info = ENNEAGRAM_TYPE_INFO[num]
  if (score >= 70) {
    return `Strong ${info.name} traits: ${info.description}`
  }
  if (score >= 50) {
    return `Moderate ${info.name} tendencies present.`
  }
  return `Low ${info.name} identification.`
}
