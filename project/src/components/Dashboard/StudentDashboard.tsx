import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BookOpen, Trophy, Clock, Target, TrendingUp, Award, MessageCircle } from 'lucide-react';
import { LearningModule, UserProgress, QuizAttempt } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState({
    completedModules: 0,
    totalModules: 0,
    averageScore: 0,
    certificationsEarned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch learning modules
      const { data: modulesData } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      // Fetch recent quiz attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const completedModules = progressData?.filter(p => p.status === 'completed').length || 0;
      const totalModules = modulesData?.length || 0;
      const averageScore = attemptsData?.length 
        ? attemptsData.reduce((sum, attempt) => sum + attempt.percentage, 0) / attemptsData.length
        : 0;

      setModules(modulesData || []);
      setProgress(progressData || []);
      setRecentAttempts(attemptsData || []);
      setStats({
        completedModules,
        totalModules,
        averageScore: Math.round(averageScore),
        certificationsEarned: attemptsData?.filter(a => a.passed).length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.full_name || 'Student'}!
              </h1>
              <p className="text-gray-600 mt-1">Continue your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="bn">বাংলা</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Modules Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedModules}/{stats.totalModules}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.certificationsEarned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((stats.completedModules / stats.totalModules) * 100) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Modules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Learning Modules</h2>
                <p className="text-gray-600 text-sm mt-1">Continue where you left off</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {modules.slice(0, 5).map((module) => {
                    const moduleProgress = progress.find(p => p.module_id === module.id);
                    const completionPercentage = moduleProgress?.completion_percentage || 0;
                    const status = moduleProgress?.status || 'not_started';
                    
                    return (
                      <div key={module.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            status === 'completed' ? 'bg-green-100' : 
                            status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <BookOpen className={`w-5 h-5 ${
                              status === 'completed' ? 'text-green-600' : 
                              status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{module.title}</h3>
                            <p className="text-sm text-gray-600">{module.subject} • {module.difficulty_level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{completionPercentage}%</p>
                            <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            {status === 'not_started' ? 'Start' : 'Continue'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Quiz Results</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{attempt.quiz_title || 'Quiz'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attempt.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score_percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentAttempts.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No quiz attempts yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                {/* Inside StudentDashboard.tsx - The corrected button */}
                 <button
   onClick={() => navigate('/chat')} 
   className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
 >
                  <BookOpen className="w-5 h-5 mr-2" />
   Start Multilingual AI Learning 
 </button>     
                <button 
                  onClick={() => navigate('/quiz-generator')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Take a Quiz
                </button>
                <button 
                  onClick={() => navigate('/chat')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start AI Chat Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};