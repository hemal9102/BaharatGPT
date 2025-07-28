import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MultilingualResponseProps {
  content: string;
}

const MultilingualResponse: React.FC<MultilingualResponseProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'english' | 'hindi' | 'gujarati'>('english');

  // Parse the content to extract different language sections
  const parseContent = () => {
    const sections = content.split('---').filter(section => section.trim());
    const languages: { [key: string]: string } = {};

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const firstLine = lines[0].trim();
      
      if (firstLine.includes('🟦 ENGLISH VERSION:')) {
        languages.english = lines.slice(1).join('\n').trim();
      } else if (firstLine.includes('🟧 HINDI VERSION:')) {
        languages.hindi = lines.slice(1).join('\n').trim();
      } else if (firstLine.includes('🟩 GUJARATI VERSION:')) {
        languages.gujarati = lines.slice(1).join('\n').trim();
      }
    });

    return languages;
  };

  const languages = parseContent();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Language Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-4">
        {Object.keys(languages).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveTab(lang as 'english' | 'hindi' | 'gujarati')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === lang
                ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lang === 'english' && '🟦 English'}
            {lang === 'hindi' && '🟧 Hindi'}
            {lang === 'gujarati' && '🟩 Gujarati'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              // Custom components for better styling
              code: ({ node, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !className || !className.includes('language-');
                return !isInline ? (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto border border-gray-300 my-4">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-gray-900 mb-3">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-gray-900 mb-2">{children}</h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700">{children}</li>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>
              ),
            }}
          >
            {languages[activeTab] || 'Content not available in this language'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MultilingualResponse; 