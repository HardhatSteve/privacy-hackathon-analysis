export type TestType = 'big5' | 'disc' | 'mbti' | 'enneagram'

export interface TestConfig {
  id: TestType
  name: string
  shortName: string
  description: string
  questionCount: number
  estimatedTime: string
  dimensions: string[]
  icon: string
}

export const TESTS_CONFIG: Record<TestType, TestConfig> = {
  big5: {
    id: 'big5',
    name: 'Big Five Personality',
    shortName: 'Big-5',
    description: 'Measures five core personality traits: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.',
    questionCount: 25,
    estimatedTime: '5-10 min',
    dimensions: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
    icon: '🧠',
  },
  disc: {
    id: 'disc',
    name: 'DISC Assessment',
    shortName: 'DISC',
    description: 'Identifies your behavioral style across four dimensions: Dominance, Influence, Steadiness, and Conscientiousness.',
    questionCount: 20,
    estimatedTime: '5-8 min',
    dimensions: ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'],
    icon: '🎯',
  },
  mbti: {
    id: 'mbti',
    name: 'MBTI-Style Assessment',
    shortName: 'MBTI',
    description: 'Explores your preferences across four dichotomies to identify your personality type among 16 possibilities.',
    questionCount: 20,
    estimatedTime: '5-8 min',
    dimensions: ['E/I', 'S/N', 'T/F', 'J/P'],
    icon: '🔮',
  },
  enneagram: {
    id: 'enneagram',
    name: 'Enneagram',
    shortName: 'Enneagram',
    description: 'Discovers your core type among nine interconnected personality types, revealing motivations and fears.',
    questionCount: 27,
    estimatedTime: '8-12 min',
    dimensions: ['Type 1-9'],
    icon: '⭐',
  },
}

export function getTestConfig(testType: TestType): TestConfig {
  return TESTS_CONFIG[testType]
}

export function getAllTests(): TestConfig[] {
  return Object.values(TESTS_CONFIG)
}
