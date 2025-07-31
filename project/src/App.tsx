import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ChatInterface } from './components/Chat/ChatInterface';
import { QuizInterface } from './components/Quiz/QuizInterface';
import { QuizGenerator } from './components/Quiz/QuizGenerator';
import { SpeechTest } from './components/Chat/SpeechTest';
import { SpeechRecognitionTest } from './components/Chat/SpeechRecognitionTest';
import { LogOut, BookOpen } from 'lucide-react';

const AuthWrapper: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  return isLogin ? (
    <LoginForm onToggleMode={() => setIsLogin(false)} />
  ) : (
    <SignupForm onToggleMode={() => setIsLogin(true)} />
  );
};

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BharatGPT...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthWrapper />;
  }

  const isAdmin = user.user_metadata?.role === 'admin';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">BharatGPT</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route 
            path="/" 
            element={
              <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAdmin ? <Navigate to="/admin" replace /> : <StudentDashboard />
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" replace />
            } 
          />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/quiz-generator" element={<QuizGenerator />} />
          <Route path="/speech-test" element={<SpeechTest />} />
          <Route path="/speech-recognition-test" element={<SpeechRecognitionTest />} />
          <Route 
            path="/quiz/:quizId" 
            element={
              <QuizInterface 
                quizId={window.location.pathname.split('/')[2]} 
                onComplete={(attempt) => console.log('Quiz completed:', attempt)}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;