// API service for n8n workflow integration
import { N8N_CONFIG } from '../config/n8n';

export interface QuizGenerationRequest {
  userId: string;
  lessonId?: string;
}

export interface QuizGenerationResponse {
  quiz: {
    title: string;
    topic: string;
    level: string;
    questions: Array<{
      type: 'mcq';
      question: string;
      options: string[];
      correct_answer: string;
    }>;
  };
}

export interface QuizSubmissionRequest {
  userId: string;
  lessonId?: string;
  userAnswers: Array<{
    questionIndex: number;
    answer: string;
  }>;
  quizData: QuizGenerationResponse['quiz'];
}

export interface QuizSubmissionResponse {
  userId: string;
  lessonId?: string;
  quiz_topic: string;
  quiz_title: string;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  passed: boolean;
  feedback: string;
  graded_questions: Array<{
    question: string;
    type: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }>;
}

export class QuizAPI {
  // Generate quiz using n8n workflow
  static async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    try {
      const response = await fetch(N8N_CONFIG.getQuizGenerationUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }

  // Submit quiz answers and get grading results
  static async submitQuiz(request: QuizSubmissionRequest): Promise<QuizSubmissionResponse> {
    try {
      const response = await fetch(N8N_CONFIG.getQuizGradingUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }
} 