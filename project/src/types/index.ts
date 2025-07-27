export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  language_preference: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  language_preference: string;
  total_modules_completed: number;
  total_quizzes_taken: number;
  average_score: number;
  certification_status: 'none' | 'in_progress' | 'certified';
  created_at: string;
  updated_at: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  video_url?: string;
  audio_url?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  time_spent_minutes: number;
  ai_feedback?: string;
  understanding_level: number; // 1-5 scale
  retry_count: number;
  last_accessed: string;
  completed_at?: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'fill_blank' | 'coding';
  options?: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string>;
  score: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  time_taken_minutes: number;
  attempt_number: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  module_id: string;
  quiz_id: string;
  grade: string;
  score: number;
  issued_date: string;
  certificate_url: string;
}

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  module_id?: string;
  understanding_feedback?: number;
}