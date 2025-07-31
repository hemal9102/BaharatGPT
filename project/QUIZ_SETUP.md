# Quiz Functionality Setup Guide

This guide explains how to set up the quiz functionality with n8n workflows for BharatGPT.

## Overview

The quiz system consists of two main components:
1. **Quiz Generation Workflow** - Generates personalized quizzes based on user learning history
2. **Quiz Grading Workflow** - Grades submitted quiz answers and provides feedback

## Prerequisites

- n8n instance running and accessible
- Supabase database with required tables
- BharatGPT frontend application

## Database Setup

Ensure your Supabase database has the following tables:

### `learning_history` table
```sql
CREATE TABLE learning_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  english TEXT,
  hindi TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `quiz_attempts` table
```sql
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  quiz_title TEXT,
  quiz_topic TEXT,
  total_questions INTEGER,
  correct_count INTEGER,
  score_percent INTEGER,
  passed BOOLEAN,
  feedback TEXT,
  graded_questions JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## n8n Workflow Setup

### 1. Quiz Generation Workflow

Import the following workflow into your n8n instance:

```json
{
  "nodes": [
    {
      "parameters": {
        "model": "qwen/qwq-32b:free",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
      "typeVersion": 1,
      "position": [600, 360],
      "id": "79ed083f-7de6-4d81-9936-5ee7123e235e",
      "name": "OpenRouter Chat Model",
      "credentials": {
        "openRouterApi": {
          "id": "nATu2Nhb9H4JpbDT",
          "name": "OpenRouter account 2"
        }
      }
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.3,
      "position": [1176, 160],
      "id": "f9820ad0-06bd-4a1f-bcec-eed04ae91e6d",
      "name": "Respond to Webhook"
    },
    {
      "parameters": {
        "jsCode": "// Process each input item\nconst returnItems = [];\n\nfor (const item of $input.all()) {\n  let quizData;\n  try {\n    // Get the raw AI response\n    const rawResponse = item.json.response || item.json.output || '';\n\n    // Clean the response: remove <think> blocks and markdown\n    const cleaned = rawResponse\n      .replace(/<think>[\\s\\S]*?<\\/think>\\s*/i, '')  // Remove <think> sections\n      .replace(/^```(?:json)?|```$/g, '')           // Remove code blocks\n      .trim();\n\n    // Parse the cleaned JSON\n    if (!cleaned) throw new Error('Empty cleaned response');\n\n    quizData = JSON.parse(cleaned);\n  } catch (e) {\n    console.error('Quiz parsing failed:', e);\n    quizData = {\n      error: \"Could not generate quiz. Please try again.\",\n      rawResponse: item.json.response || item.json.output\n    };\n  }\n\n  // Add to output\n  returnItems.push({ json: quizData });\n}\n\nreturn returnItems;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [956, 160],
      "id": "a1885baf-cfde-43c5-87ce-e92f73a120ba",
      "name": "Code"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "2e31fb8e-9f79-45b0-b40f-aa297c3d3294",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [-80, 160],
      "id": "80de7d77-0db7-4f2b-84eb-16b6779342e1",
      "name": "Webhook1",
      "webhookId": "2e31fb8e-9f79-45b0-b40f-aa297c3d3294"
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "learning_history",
        "returnAll": true,
        "filterType": "string"
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [140, 160],
      "id": "e19bdb29-bef5-4ee6-b02e-241d1e6bba71",
      "name": "Supabase",
      "credentials": {
        "supabaseApi": {
          "id": "ISRAL4BPX9ZlmBPj",
          "name": "Supabase account"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Define topics with keywords (prioritized order)\nconst topics = [\n  { name: \"HTML\", keywords: ['html', 'markup', 'tag', 'element', 'hyper text'] },\n  { name: \"Web Browser\", keywords: ['browser', 'chrome', 'firefox', 'safari', 'edge', 'open browser'] },\n  { name: \"Search Engine Basics\", keywords: ['search', 'google', 'find', 'results', 'query', 'look up'] },\n  { name: \"Email\", keywords: ['email', 'gmail', 'outlook', 'send message', 'inbox', 'mail'] },\n  { name: \"Websites\", keywords: ['website', 'web page', 'url', 'link', 'visit', 'site'] },\n  { name: \"Internet Basics\", keywords: ['internet', 'online', 'connect', 'network', 'world wide web'] },\n  { name: \"Passwords\", keywords: ['password', 'login', 'sign in', 'secure', 'protect'] },\n  { name: \"Digital Literacy Basics\", keywords: ['digital literacy', 'learn online', 'basic skills'] }\n];\n\n// Output list\nconst returnItems = [];\n\nfor (const item of $input.all()) {\n  const content = (item.json.english || '').toLowerCase();\n  const detectedTopics = [];\n\n  // Check each topic\n  for (const topic of topics) {\n    // Skip the fallback topic unless nothing else matches\n    if (topic.name === 'Digital Literacy Basics') continue;\n\n    // If any keyword matches\n    if (topic.keywords.some(kw => content.includes(kw))) {\n      detectedTopics.push(topic.name);\n    }\n  }\n\n  // Fallback: if no topic detected\n  if (detectedTopics.length === 0) {\n    detectedTopics.push('Digital Literacy Basics');\n  }\n\n  returnItems.push({\n    json: {\n      module: detectedTopics,           // ← Array of topics\n      topicCount: detectedTopics.length,\n      lastLessonId: item.json.id,\n      timestamp: item.json.timestamp,\n      detectedFrom: 'english-content-keyword-scan'\n    }\n  });\n}\n\nreturn returnItems;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [360, 160],
      "id": "a1728a30-7711-49e3-9824-53c9784c96cc",
      "name": "Code2"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.module }}",
        "options": {
          "systemMessage": "=You are a digital literacy quiz generator.\n\nThe user has learned about these topics: {{ $json.module }}.\n\n📌 Rules:\n- Return ONLY a JSON object — no explanations, no markdown, no <think> tags, no comments.\n- Do NOT include reasoning, thoughts, or extra text.\n- Start with `{` and end with `}` — nothing before or after.\n- Use this exact format:\n\n{\n  \"quiz\": {\n    \"title\": \"Understanding Search Engine Basics\",\n    \"topic\": \"Search Engine Basics\",\n    \"level\": \"basic\",\n    \"questions\": [\n      {\n        \"type\": \"mcq\",\n        \"question\": \"What is the main purpose of a search engine?\",\n        \"options\": [\"...\", \"...\"],\n        \"correct_answer\": \"...\"\n      }\n    ]\n  }\n}\nReturn ONLY the JSON — nothing else."
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2,
      "position": [580, 160],
      "id": "8f272339-04cc-48e7-9674-e7bb133a0b89",
      "name": "AI Agent"
    }
  ],
  "connections": {
    "OpenRouter Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Code": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook1": {
      "main": [
        [
          {
            "node": "Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Supabase": {
      "main": [
        [
          {
            "node": "Code2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code2": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Code",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 2. Quiz Grading Workflow

Import the following workflow into your n8n instance:

```json
{
  "nodes": [
    {
      "parameters": {
        "jsCode": "// Clean and parse AI output into quiz object\nfunction parseQuiz(raw) {\n  if (!raw) return null;\n\n  // Remove <think> blocks and code fences\n  const cleaned = raw\n    .replace(/<think>[\\s\\S]*?<\\/think>/gi, '')\n    .replace(/^```(?:json)?|```$/g, '')\n    .trim();\n\n  try {\n    const parsed = JSON.parse(cleaned);\n    return parsed.quiz || parsed; // Handle { quiz: { ... } } or direct quiz\n  } catch (e) {\n    console.error('Failed to parse quiz JSON:', e);\n    return null;\n  }\n}\n\n// Process each item\nconst returnItems = [];\n\nfor (const item of $input.all()) {\n  // Get AI output\n  const rawOutput = item.json.output;\n\n  // Parse quiz\n  const quiz = parseQuiz(rawOutput);\n\n  if (!quiz || !quiz.questions) {\n    returnItems.push({\n      json: {\n        error: \"Could not extract quiz or questions\",\n        rawOutput,\n        warning: \"Invalid or missing quiz data\"\n      }\n    });\n    continue;\n  }\n\n  // Get user answers\n  const userAnswers = item.json.userAnswers || [];\n  const userId = item.json.userId || 'unknown';\n  const lessonId = item.json.lessonId || null;\n\n  let correctCount = 0;\n\n  // Grade each answer\n  const gradedResponses = quiz.questions.map((q, index) => {\n    const userAnswerObj = userAnswers.find(a => a.questionIndex === index);\n    const userAnswer = userAnswerObj?.answer?.trim();\n    const correct = q.correct_answer?.trim();\n\n    const isCorrect = userAnswer === correct;\n    if (isCorrect) correctCount++;\n\n    return {\n      question: q.question,\n      type: q.type,\n      user_answer: userAnswer,\n      correct_answer: correct,\n      is_correct: isCorrect\n    };\n  });\n\n  const total = gradedResponses.length;\n  const scorePercent = Math.round((correctCount / total) * 100);\n  const passed = scorePercent >= 60;\n\n  // Build result\n  const result = {\n    userId,\n    lessonId,\n    quiz_topic: quiz.topic || 'Unknown',\n    quiz_title: quiz.title || 'Quiz',\n    total_questions: total,\n    correct_count: correctCount,\n    score_percent: scorePercent,\n    passed,\n    feedback: passed\n      ? \"Great job! You're mastering this topic.\"\n      : \"Keep practicing! You're getting there.\",\n    graded_questions: gradedResponses\n  };\n\n  returnItems.push({ json: result });\n}\n\nreturn returnItems;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [-660, 100],
      "id": "d70f8677-03cb-461b-8995-0e75769be0f8",
      "name": "Code1"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "44d2d27d-4936-4ff2-a808-b6b11679e08b",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [-880, 100],
      "id": "8b8fe3e0-97b8-4002-ab85-4079c3f57fbf",
      "name": "Webhook",
      "webhookId": "44d2d27d-4936-4ff2-a808-b6b11679e08b"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.3,
      "position": [-220, 100],
      "id": "a91ceb90-ea81-450b-abbb-55c7837c6d59",
      "name": "Respond to Webhook"
    },
    {
      "parameters": {
        "tableId": "quiz_attempts"
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [-440, 100],
      "id": "25542b4d-b52b-4292-8efd-afa9bfb89352",
      "name": "Supabase1",
      "credentials": {
        "supabaseApi": {
          "id": "ISRAL4BPX9ZlmBPj",
          "name": "Supabase account"
        }
      }
    }
  ],
  "connections": {
    "Code1": {
      "main": [
        [
          {
            "node": "Supabase1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Webhook": {
      "main": [
        [
          {
            "node": "Code1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Supabase1": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Frontend Configuration

1. Update the n8n configuration in `src/config/n8n.ts`:

```typescript
export const N8N_CONFIG = {
  // Replace with your actual n8n instance URL
  BASE_URL: 'https://your-n8n-instance.com',
  
  // Quiz Generation Workflow
  QUIZ_GENERATION_WEBHOOK: '2e31fb8e-9f79-45b0-b40f-aa297c3d3294',
  
  // Quiz Grading Workflow  
  QUIZ_GRADING_WEBHOOK: '44d2d27d-4936-4ff2-a808-b6b11679e08b',
  
  // Helper function to get full webhook URLs
  getQuizGenerationUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GENERATION_WEBHOOK}`,
  getQuizGradingUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GRADING_WEBHOOK}`,
};
```

2. Ensure your Supabase credentials are properly configured in `src/lib/supabase.ts`

## Usage

1. Users can click the "Take a Quiz" button on the dashboard
2. The system will generate a personalized quiz based on their learning history
3. Users answer the questions and submit
4. The system grades the quiz and saves results to the database
5. Users see their results with detailed feedback

## Features

- **Personalized Quizzes**: Based on user learning history
- **Real-time Grading**: Immediate feedback on quiz completion
- **Progress Tracking**: Quiz attempts are saved to the database
- **Detailed Results**: Shows correct/incorrect answers with explanations
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

1. **Quiz Generation Fails**: Check n8n workflow is active and accessible
2. **Database Errors**: Verify Supabase table structure and permissions
3. **Network Issues**: Ensure n8n instance is accessible from the frontend
4. **Authentication**: Verify user authentication is working properly

## Security Considerations

- Ensure n8n webhooks are properly secured
- Validate user permissions before allowing quiz access
- Sanitize user inputs to prevent injection attacks
- Use HTTPS for all API communications 