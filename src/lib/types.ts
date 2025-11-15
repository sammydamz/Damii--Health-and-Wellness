export interface WellnessLog {
  date: string; // YYYY-MM-DD
  mood: number; // 1 to 5
  activities: string[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
