import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserLearningHistory, saveQuizAttempt, saveLearningHistory } from '../../lib/quizService';
import { supabase } from '../../lib/supabase';
import { QuizAPI, QuizGenerationResponse, QuizSubmissionResponse } from '../../lib/api';
import { Clock, CheckCircle, XCircle, Award, RotateCcw, Loader2 } from 'lucide-react';

interface QuizGeneratorProps {
  onComplete?: (result: QuizSubmissionResponse) => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizGenerationResponse['quiz'] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes default
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizSubmissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timeRemaining > 0 && quiz && !showResults) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && quiz && !showResults) {
      handleSubmit();
    }
  }, [timeRemaining, quiz, showResults]);

  const generateQuiz = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Get user's learning history to determine topics
      const { data: learningHistory } = await getUserLearningHistory();

      // Try to generate quiz from n8n workflow
      try {
        const quizData = await QuizAPI.generateQuiz({
          userId: user.id,
          lessonId: learningHistory?.[0]?.id || undefined,
        });

        setQuiz(quizData.quiz);
        setTimeRemaining(600); // Reset timer
        setCurrentQuestionIndex(0);
        setAnswers({});

        // Save learning history for quiz generation
        await saveLearningHistory({
          topic: quizData.quiz.topic,
          activity_type: 'quiz_generated',
          details: {
            quiz_title: quizData.quiz.title,
            question_count: quizData.quiz.questions.length
          }
        });
      } catch (n8nError) {
        console.error('N8N workflow error:', n8nError);
        
        // Fallback: Generate a simple quiz locally
        const fallbackQuiz = {
          title: "Digital Literacy Basics Quiz",
          topic: "Digital Literacy",
          level: "beginner",
          questions: [
            {
              type: 'mcq' as const,
              question: "What is the primary purpose of a web browser?",
              options: [
                "To create documents",
                "To browse and view websites on the internet",
                "To send emails",
                "To play games"
              ],
              correct_answer: "To browse and view websites on the internet"
            },
            {
              type: 'mcq' as const,
              question: "Which of the following is NOT a common file format for images?",
              options: [
                "JPEG",
                "PNG",
                "MP3",
                "GIF"
              ],
              correct_answer: "MP3"
            },
            {
              type: 'mcq' as const,
              question: "What does 'URL' stand for?",
              options: [
                "Uniform Resource Locator",
                "Universal Reference Link",
                "User Resource Location",
                "Uniform Reference Locator"
              ],
              correct_answer: "Uniform Resource Locator"
            },
            {
              type: 'mcq' as const,
              question: "Which programming language is commonly used for web development?",
              options: [
                "Java",
                "Python",
                "JavaScript",
                "All of the above"
              ],
              correct_answer: "All of the above"
            },
            {
              type: 'mcq' as const,
              question: "What is the purpose of a firewall?",
              options: [
                "To speed up internet connection",
                "To protect against unauthorized access to a network",
                "To store files",
                "To create backups"
              ],
              correct_answer: "To protect against unauthorized access to a network"
            }
          ]
        };

        setQuiz(fallbackQuiz);
        setTimeRemaining(600);
        setCurrentQuestionIndex(0);
        setAnswers({});

        // Save learning history for fallback quiz
        await saveLearningHistory({
          topic: "Digital Literacy",
          activity_type: 'quiz_generated_fallback',
          details: {
            quiz_title: fallbackQuiz.title,
            question_count: fallbackQuiz.questions.length
          }
        });
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;

    setIsSubmitting(true);

    try {
      // Convert answers to the format expected by the n8n workflow
      const userAnswers = Object.entries(answers).map(([index, answer]) => ({
        questionIndex: parseInt(index),
        answer: answer.trim()
      }));

      let result: QuizSubmissionResponse;

      try {
        // Try to submit to n8n workflow
        result = await QuizAPI.submitQuiz({
          userId: user.id,
          userAnswers,
          quizData: quiz,
        });
      } catch (n8nError) {
        console.error('N8N submission error:', n8nError);
        
        // Fallback: Grade locally
        const gradedQuestions = quiz.questions.map((question, index) => {
          const userAnswer = answers[index] || '';
          const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.toLowerCase();
          
          return {
            question: question.question,
            type: question.type,
            user_answer: userAnswer,
            correct_answer: question.correct_answer,
            is_correct: isCorrect
          };
        });

        const correctCount = gradedQuestions.filter(q => q.is_correct).length;
        const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = scorePercent >= 70; // 70% passing threshold

        result = {
          userId: user.id,
          quiz_topic: quiz.topic,
          quiz_title: quiz.title,
          total_questions: quiz.questions.length,
          correct_count: correctCount,
          score_percent: scorePercent,
          passed: passed,
          feedback: passed 
            ? "Great job! You've demonstrated good understanding of the material."
            : "Keep practicing! Review the material and try again.",
          graded_questions: gradedQuestions
        };
      }

      setResults(result);
      setShowResults(true);

      // Save to Supabase
      if (user) {
        await saveQuizAttempt({
          user_id: user.id,
          quiz_topic: result.quiz_topic,
          quiz_title: result.quiz_title,
          total_questions: result.total_questions,
          correct_count: result.correct_count,
          score_percent: result.score_percent,
          passed: result.passed,
          feedback: result.feedback,
          graded_questions: result.graded_questions,
          completed_at: new Date().toISOString(),
        });

        // Save learning history
        await saveLearningHistory({
          topic: result.quiz_topic,
          activity_type: 'quiz_completed',
          details: {
            score: result.score_percent,
            passed: result.passed,
            total_questions: result.total_questions
          }
        });
      }

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Quiz Generation Screen
  if (!quiz && !isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Take a Quiz</h1>
          <p className="text-gray-600 mb-8">
            Test your knowledge with an AI-generated quiz based on your learning history.
          </p>
          <button
            onClick={generateQuiz}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Generate Quiz
          </button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Generating Quiz</h1>
          <p className="text-gray-600">
            Creating a personalized quiz based on your learning progress...
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => {
              setError(null);
              generateQuiz();
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              results.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {results.passed ? (
                <Award className="w-10 h-10 text-green-600" />
              ) : (
                <RotateCcw className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {results.passed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>
            <p className="text-gray-600 mb-4">{results.feedback}</p>
            <p className="text-sm text-gray-500">Topic: {results.quiz_topic}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{results.score_percent}%</p>
              <p className="text-gray-600">Score</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {results.correct_count}/{results.total_questions}
              </p>
              <p className="text-gray-600">Correct Answers</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">Question Results:</h3>
            {results.graded_questions.map((q, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Question {index + 1}</span>
                  {q.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-gray-700 mb-2">{q.question}</p>
                <div className="text-sm">
                  <p className="text-gray-600">Your answer: {q.user_answer}</p>
                  {!q.is_correct && (
                    <p className="text-green-600">Correct answer: {q.correct_answer}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowResults(false);
                setResults(null);
                generateQuiz();
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Take Another Quiz
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-red-600">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              Previous
            </button>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 