import { supabase } from './supabase';
import { QuizAttempt } from '../types';

export async function getUserLearningHistory(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('learning_history')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching learning history:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return a specific error object/value.
  }
  return { data, error };
}

// You might also create a function for saving quiz attempts if it gets complex
export async function saveQuizAttempt(attemptData: Omit<QuizAttempt, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert(attemptData);

  if (error) {
    console.error('Error saving quiz attempt:', error);
  }
  return { data, error };
}

// Potentially a function for fetching a generated quiz if it's stored
// export async function fetchQuizById(quizId: string) { ... }

// Get user's quiz history
export async function getUserQuizHistory(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching quiz history:', error);
  }
  return { data, error };
}

// Get user's learning progress
export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed', { ascending: false });

  if (error) {
    console.error('Error fetching user progress:', error);
  }
  return { data, error };
}

// Save learning history entry
export async function saveLearningHistory(historyData: {
  user_id: string;
  module_id?: string;
  topic: string;
  activity_type: string;
  details?: any;
}) {
  const { data, error } = await supabase
    .from('learning_history')
    .insert({
      ...historyData,
      timestamp: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving learning history:', error);
  }
  return { data, error };
}
