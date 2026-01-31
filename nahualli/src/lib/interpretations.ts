import type { TestResult } from './big5-questions'
import type { DISCResult } from './disc-questions'
import type { MBTIResult } from './mbti-questions'
import type { EnneagramResult } from './enneagram-questions'
import { getDISCProfile } from './disc-questions'
import { getMBTIType, MBTI_TYPE_DESCRIPTIONS } from './mbti-questions'
import { getDominantType, getWing, ENNEAGRAM_TYPE_INFO } from './enneagram-questions'

export interface PersonalityInterpretation {
  summary: string
  strengths: string[]
  growthAreas: string[]
  careerRecommendations: string[]
  communicationStyle: string
  workStyle: string
  testType: string
}

// ============ BIG-5 INTERPRETATIONS ============

export function generateBig5Interpretation(scores: TestResult): PersonalityInterpretation {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = scores
  
  const strengths: string[] = []
  const growthAreas: string[] = []
  
  if (openness >= 60) strengths.push('Creative thinking and openness to new ideas')
  else growthAreas.push('Exploring new perspectives and experiences')
  
  if (conscientiousness >= 60) strengths.push('Organization and goal-oriented focus')
  else growthAreas.push('Building consistent habits and follow-through')
  
  if (extraversion >= 60) strengths.push('Social energy and communication skills')
  else strengths.push('Deep thinking and focused attention')
  
  if (agreeableness >= 60) strengths.push('Empathy and collaborative spirit')
  else strengths.push('Independent decision-making and directness')
  
  if (neuroticism < 40) strengths.push('Emotional stability under pressure')
  else growthAreas.push('Developing stress management techniques')

  return {
    summary: generateBig5Summary(scores),
    strengths,
    growthAreas,
    careerRecommendations: generateBig5Careers(scores),
    communicationStyle: generateBig5Communication(scores),
    workStyle: generateBig5WorkStyle(scores),
    testType: 'big5'
  }
}

function generateBig5Summary(scores: TestResult): string {
  const { openness, conscientiousness, extraversion } = scores
  
  if (openness >= 70 && conscientiousness >= 60) {
    return 'You are a creative achiever who combines imagination with discipline. You thrive when you can innovate within structured environments.'
  }
  if (extraversion >= 70 && conscientiousness >= 60) {
    return 'You are a natural leader who energizes teams while maintaining focus on goals. You excel at motivating others toward achievement.'
  }
  if (openness >= 60 && extraversion < 40) {
    return 'You are a thoughtful innovator who prefers depth over breadth. You excel at developing unique insights through reflection.'
  }
  return 'You have a balanced personality profile that allows you to adapt to various situations and roles effectively.'
}

function generateBig5Careers(scores: TestResult): string[] {
  const careers: string[] = []
  const { openness, conscientiousness, extraversion, agreeableness } = scores
  
  if (openness >= 60 && conscientiousness >= 60) {
    careers.push('Product Manager', 'UX Designer', 'Architect')
  }
  if (extraversion >= 60 && agreeableness >= 60) {
    careers.push('Sales Manager', 'HR Director', 'Teacher')
  }
  if (conscientiousness >= 70 && extraversion < 50) {
    careers.push('Software Engineer', 'Data Analyst', 'Accountant')
  }
  if (openness >= 70 && extraversion >= 60) {
    careers.push('Marketing Director', 'Entrepreneur', 'Consultant')
  }
  
  return careers.length > 0 ? careers.slice(0, 4) : ['Generalist', 'Project Coordinator', 'Analyst']
}

function generateBig5Communication(scores: TestResult): string {
  const { extraversion, agreeableness } = scores
  
  if (extraversion >= 70 && agreeableness >= 60) {
    return 'You communicate with warmth and enthusiasm, naturally engaging others. You excel at building rapport and making people feel valued.'
  }
  if (extraversion >= 70 && agreeableness < 40) {
    return 'You communicate directly and assertively. You are effective at driving discussions and making your position clear.'
  }
  if (extraversion < 40 && agreeableness >= 60) {
    return 'You communicate thoughtfully and with care, listening attentively before responding. You create safe spaces for dialogue.'
  }
  return 'You adapt your communication style to the situation, balancing directness with diplomacy.'
}

function generateBig5WorkStyle(scores: TestResult): string {
  const { conscientiousness, openness, extraversion } = scores
  
  if (conscientiousness >= 70 && openness >= 60) {
    return 'You thrive with structured creativity—organized processes that allow for innovation.'
  }
  if (conscientiousness >= 70 && extraversion >= 60) {
    return 'You work best in collaborative, goal-oriented environments leading projects and teams.'
  }
  if (conscientiousness < 40 && openness >= 70) {
    return 'You thrive in dynamic, flexible environments where you can explore and experiment.'
  }
  return 'You adapt well to different work environments, balancing independent focus with collaboration.'
}

// ============ DISC INTERPRETATIONS ============

export function generateDISCInterpretation(scores: DISCResult): PersonalityInterpretation {
  const profile = getDISCProfile(scores)
  const { dominance, influence, steadiness, conscientiousness } = scores
  
  const strengths: string[] = []
  const growthAreas: string[] = []
  
  if (dominance >= 60) {
    strengths.push('Decisive leadership and results-driven focus')
  } else {
    growthAreas.push('Being more assertive in decision-making')
  }
  
  if (influence >= 60) {
    strengths.push('Persuasion and relationship building')
  } else {
    growthAreas.push('Developing networking and influence skills')
  }
  
  if (steadiness >= 60) {
    strengths.push('Reliability and team harmony')
  } else {
    growthAreas.push('Building patience and consistency')
  }
  
  if (conscientiousness >= 60) {
    strengths.push('Attention to detail and quality standards')
  } else {
    growthAreas.push('Focusing on accuracy and thoroughness')
  }

  return {
    summary: generateDISCSummary(profile, scores),
    strengths,
    growthAreas,
    careerRecommendations: generateDISCCareers(profile),
    communicationStyle: generateDISCCommunication(profile),
    workStyle: generateDISCWorkStyle(profile),
    testType: 'disc'
  }
}

function generateDISCSummary(profile: string, _scores: DISCResult): string {
  const summaries: Record<string, string> = {
    'D': 'You are a Driver—direct, decisive, and results-oriented. You thrive on challenges and taking charge of situations.',
    'I': 'You are an Influencer—enthusiastic, optimistic, and people-oriented. You excel at inspiring and motivating others.',
    'S': 'You are a Supporter—patient, reliable, and team-oriented. You create stability and harmony in your environment.',
    'C': 'You are a Conscientious type—analytical, precise, and quality-focused. You excel at systematic problem-solving.',
    'DI': 'You combine Drive with Influence—a charismatic leader who inspires action and achieves results through people.',
    'DC': 'You combine Drive with Conscientiousness—a strategic achiever who pursues goals with precision and analysis.',
    'ID': 'You combine Influence with Drive—an inspiring motivator who can also push for results when needed.',
    'IS': 'You combine Influence with Steadiness—a warm connector who builds lasting relationships and team harmony.',
    'SC': 'You combine Steadiness with Conscientiousness—a reliable specialist who ensures quality and consistency.',
    'SD': 'You combine Steadiness with Drive—a persistent achiever who maintains stability while pursuing goals.',
    'CD': 'You combine Conscientiousness with Drive—a perfectionist achiever who demands excellence in results.',
    'CS': 'You combine Conscientiousness with Steadiness—a methodical supporter who ensures accuracy and reliability.',
  }
  return summaries[profile] || 'You have a balanced DISC profile that allows you to adapt to various situations.'
}

function generateDISCCareers(profile: string): string[] {
  const careers: Record<string, string[]> = {
    'D': ['CEO', 'Entrepreneur', 'Sales Director', 'Attorney'],
    'I': ['Marketing Manager', 'Public Relations', 'Recruiter', 'Event Planner'],
    'S': ['HR Manager', 'Counselor', 'Nurse', 'Customer Success'],
    'C': ['Data Scientist', 'Auditor', 'Engineer', 'Quality Analyst'],
    'DI': ['Business Development', 'Startup Founder', 'Sales Executive'],
    'DC': ['Management Consultant', 'Investment Banker', 'Operations Director'],
    'IS': ['Team Lead', 'Training Manager', 'Social Worker'],
    'SC': ['Project Manager', 'Technical Writer', 'Compliance Officer'],
  }
  return careers[profile] || careers[profile[0]] || ['Generalist', 'Coordinator']
}

function generateDISCCommunication(profile: string): string {
  if (profile.includes('D')) {
    return 'You communicate directly and efficiently, focusing on results and bottom-line impact. You prefer brief, action-oriented conversations.'
  }
  if (profile.includes('I')) {
    return 'You communicate with enthusiasm and storytelling, building connections through shared experiences and positive energy.'
  }
  if (profile.includes('S')) {
    return 'You communicate with patience and sincerity, taking time to listen and ensure everyone feels included.'
  }
  return 'You communicate with precision and logic, preferring data-driven discussions and well-structured arguments.'
}

function generateDISCWorkStyle(profile: string): string {
  if (profile.includes('D')) {
    return 'You work best with autonomy and clear goals, driving projects forward with urgency and determination.'
  }
  if (profile.includes('I')) {
    return 'You work best in collaborative, dynamic environments with variety and opportunities to interact with others.'
  }
  if (profile.includes('S')) {
    return 'You work best in stable, supportive environments with clear expectations and team cooperation.'
  }
  return 'You work best with clear processes, time for analysis, and high standards for quality.'
}

// ============ MBTI INTERPRETATIONS ============

export function generateMBTIInterpretation(scores: MBTIResult): PersonalityInterpretation {
  const type = getMBTIType(scores)
  const typeInfo = MBTI_TYPE_DESCRIPTIONS[type]
  
  const strengths: string[] = []
  const growthAreas: string[] = []
  
  // E vs I
  if (scores.extraversion >= 50) {
    strengths.push('Social energy and external processing')
  } else {
    strengths.push('Deep reflection and focused concentration')
    growthAreas.push('Engaging more in group discussions')
  }
  
  // N vs S
  if (scores.intuition >= 50) {
    strengths.push('Pattern recognition and future thinking')
  } else {
    strengths.push('Practical awareness and attention to details')
  }
  
  // F vs T
  if (scores.feeling >= 50) {
    strengths.push('Empathy and values-based decisions')
  } else {
    strengths.push('Logical analysis and objective evaluation')
  }
  
  // P vs J
  if (scores.perceiving >= 50) {
    strengths.push('Adaptability and spontaneity')
    growthAreas.push('Following through on commitments')
  } else {
    strengths.push('Organization and planning')
    growthAreas.push('Being more flexible with changes')
  }

  return {
    summary: typeInfo?.description || `You are ${type} - a unique combination of cognitive preferences.`,
    strengths,
    growthAreas,
    careerRecommendations: generateMBTICareers(type),
    communicationStyle: generateMBTICommunication(scores),
    workStyle: generateMBTIWorkStyle(scores),
    testType: 'mbti'
  }
}

function generateMBTICareers(type: string): string[] {
  const careers: Record<string, string[]> = {
    'INTJ': ['Strategist', 'Scientist', 'Systems Architect', 'Investment Analyst'],
    'INTP': ['Software Developer', 'Researcher', 'Philosopher', 'Data Scientist'],
    'ENTJ': ['CEO', 'Management Consultant', 'Entrepreneur', 'Attorney'],
    'ENTP': ['Entrepreneur', 'Creative Director', 'Venture Capitalist', 'Inventor'],
    'INFJ': ['Counselor', 'Writer', 'Psychologist', 'HR Director'],
    'INFP': ['Writer', 'Therapist', 'Artist', 'UX Designer'],
    'ENFJ': ['Teacher', 'HR Manager', 'Life Coach', 'Non-profit Director'],
    'ENFP': ['Marketing Creative', 'Journalist', 'Consultant', 'Entrepreneur'],
    'ISTJ': ['Accountant', 'Project Manager', 'Military Officer', 'Judge'],
    'ISFJ': ['Nurse', 'Teacher', 'Social Worker', 'Office Manager'],
    'ESTJ': ['Manager', 'Judge', 'Financial Officer', 'School Principal'],
    'ESFJ': ['Healthcare Administrator', 'Event Planner', 'Sales Manager', 'Teacher'],
    'ISTP': ['Engineer', 'Mechanic', 'Pilot', 'Forensic Scientist'],
    'ISFP': ['Artist', 'Veterinarian', 'Chef', 'Physical Therapist'],
    'ESTP': ['Entrepreneur', 'Sales Executive', 'Paramedic', 'Detective'],
    'ESFP': ['Event Planner', 'Tour Guide', 'Actor', 'Flight Attendant'],
  }
  return careers[type] || ['Generalist', 'Coordinator', 'Analyst']
}

function generateMBTICommunication(scores: MBTIResult): string {
  const { extraversion, intuition, feeling } = scores
  
  if (extraversion >= 60 && feeling >= 60) {
    return 'You communicate with warmth and expressiveness, naturally connecting with others on an emotional level.'
  }
  if (extraversion >= 60 && feeling < 40) {
    return 'You communicate with confidence and logic, enjoying debates and intellectual discussions.'
  }
  if (extraversion < 40 && intuition >= 60) {
    return 'You communicate with depth and insight, preferring meaningful one-on-one conversations over small talk.'
  }
  return 'You communicate thoughtfully, choosing your words carefully and preferring substance over style.'
}

function generateMBTIWorkStyle(scores: MBTIResult): string {
  const { extraversion, perceiving, intuition } = scores
  
  if (perceiving >= 60 && intuition >= 60) {
    return 'You thrive in flexible, innovative environments where you can explore possibilities and adapt as you go.'
  }
  if (perceiving < 40 && extraversion >= 60) {
    return 'You work best leading organized teams with clear goals and structured processes.'
  }
  if (perceiving < 40 && extraversion < 40) {
    return 'You excel with independent, focused work time and well-defined objectives.'
  }
  return 'You adapt your work style based on the project needs, balancing structure with flexibility.'
}

// ============ ENNEAGRAM INTERPRETATIONS ============

export function generateEnneagramInterpretation(scores: EnneagramResult): PersonalityInterpretation {
  const dominant = getDominantType(scores)
  const wing = getWing(scores)
  const typeInfo = ENNEAGRAM_TYPE_INFO[dominant]
  
  return {
    summary: `You are a ${wing} - ${typeInfo.name}. ${typeInfo.description}`,
    strengths: getEnneagramStrengths(dominant),
    growthAreas: getEnneagramGrowth(dominant),
    careerRecommendations: getEnneagramCareers(dominant),
    communicationStyle: getEnneagramCommunication(dominant),
    workStyle: getEnneagramWorkStyle(dominant),
    testType: 'enneagram'
  }
}

function getEnneagramStrengths(type: number): string[] {
  const strengths: Record<number, string[]> = {
    1: ['High standards and integrity', 'Attention to detail', 'Strong sense of purpose'],
    2: ['Empathy and generosity', 'Relationship building', 'Intuitive understanding of needs'],
    3: ['Achievement drive', 'Adaptability', 'Inspiring and motivating others'],
    4: ['Creativity and authenticity', 'Emotional depth', 'Unique perspective'],
    5: ['Analytical thinking', 'Independence', 'Deep expertise'],
    6: ['Loyalty and commitment', 'Troubleshooting', 'Team dedication'],
    7: ['Optimism and enthusiasm', 'Quick thinking', 'Versatility'],
    8: ['Leadership and decisiveness', 'Protecting others', 'Direct communication'],
    9: ['Mediation and harmony', 'Patience', 'Seeing all perspectives'],
  }
  return strengths[type] || []
}

function getEnneagramGrowth(type: number): string[] {
  const growth: Record<number, string[]> = {
    1: ['Accepting imperfection', 'Being less critical of self and others'],
    2: ['Setting boundaries', 'Acknowledging own needs'],
    3: ['Valuing being over doing', 'Authentic self-expression'],
    4: ['Emotional balance', 'Appreciating the ordinary'],
    5: ['Engaging with emotions', 'Taking action without complete information'],
    6: ['Trusting yourself', 'Managing anxiety'],
    7: ['Staying present', 'Following through on commitments'],
    8: ['Showing vulnerability', 'Listening to others'],
    9: ['Asserting yourself', 'Engaging with conflict when necessary'],
  }
  return growth[type] || []
}

function getEnneagramCareers(type: number): string[] {
  const careers: Record<number, string[]> = {
    1: ['Quality Assurance', 'Editor', 'Judge', 'Ethics Officer'],
    2: ['Counselor', 'Nurse', 'HR Manager', 'Non-profit Director'],
    3: ['Sales Executive', 'Marketing Director', 'Entrepreneur', 'Politician'],
    4: ['Artist', 'Writer', 'Therapist', 'Designer'],
    5: ['Researcher', 'Scientist', 'Engineer', 'Professor'],
    6: ['Security Analyst', 'Paralegal', 'Project Manager', 'Detective'],
    7: ['Entrepreneur', 'Travel Writer', 'Event Planner', 'Creative Director'],
    8: ['CEO', 'Attorney', 'Military Leader', 'Business Owner'],
    9: ['Mediator', 'Counselor', 'Diplomat', 'Librarian'],
  }
  return careers[type] || []
}

function getEnneagramCommunication(type: number): string {
  const styles: Record<number, string> = {
    1: 'You communicate with precision and principle, focusing on what is right and how things should be done.',
    2: 'You communicate with warmth and care, naturally attuning to others\' emotional needs.',
    3: 'You communicate with confidence and polish, adapting your message to your audience for maximum impact.',
    4: 'You communicate with depth and authenticity, expressing your unique perspective and emotional truth.',
    5: 'You communicate with clarity and logic, preferring substantive discussions over small talk.',
    6: 'You communicate with thoughtfulness, often playing devil\'s advocate to ensure all risks are considered.',
    7: 'You communicate with enthusiasm and optimism, generating excitement and exploring possibilities.',
    8: 'You communicate with directness and power, saying what you mean and meaning what you say.',
    9: 'You communicate with diplomacy and inclusivity, ensuring all voices are heard and harmony is maintained.',
  }
  return styles[type] || 'You communicate in a balanced, adaptable manner.'
}

function getEnneagramWorkStyle(type: number): string {
  const styles: Record<number, string> = {
    1: 'You work methodically with high standards, ensuring quality and correctness in everything you do.',
    2: 'You work collaboratively, building relationships and supporting team members to succeed.',
    3: 'You work efficiently toward goals, driven by achievement and recognition for your accomplishments.',
    4: 'You work creatively, bringing unique vision and emotional depth to your projects.',
    5: 'You work independently, diving deep into subjects and developing expertise.',
    6: 'You work reliably, anticipating problems and ensuring security and stability.',
    7: 'You work energetically, bringing innovation and variety to keep things exciting.',
    8: 'You work decisively, taking charge and driving projects forward with determination.',
    9: 'You work steadily, creating harmony and ensuring everyone is aligned and included.',
  }
  return styles[type] || 'You adapt your work style to the needs of the situation.'
}

// ============ UNIFIED GENERATOR ============

export type AnyTestResult = TestResult | DISCResult | MBTIResult | EnneagramResult

export function generateInterpretation(
  testType: string,
  scores: AnyTestResult
): PersonalityInterpretation {
  switch (testType) {
    case 'big5':
      return generateBig5Interpretation(scores as TestResult)
    case 'disc':
      return generateDISCInterpretation(scores as DISCResult)
    case 'mbti':
      return generateMBTIInterpretation(scores as MBTIResult)
    case 'enneagram':
      return generateEnneagramInterpretation(scores as EnneagramResult)
    default:
      return {
        summary: 'Your personality assessment has been completed.',
        strengths: ['Self-awareness', 'Growth mindset'],
        growthAreas: ['Continue exploring your personality'],
        careerRecommendations: ['Various roles suited to your profile'],
        communicationStyle: 'Adaptable communication style',
        workStyle: 'Flexible work approach',
        testType
      }
  }
}
