// n8n Workflow Configuration
export const N8N_CONFIG = {
  // Use environment variables or fallback to default URLs
  BASE_URL: import.meta.env.VITE_N8N_BASE_URL || 'https://e033a98c0626.ngrok-free.app',
  
  // Quiz Generation Workflow
  QUIZ_GENERATION_WEBHOOK: import.meta.env.VITE_QUIZ_GENERATION_WEBHOOK || '2e31fb8e-9f79-45b0-b40f-aa297c3d3294',
  
  // Quiz Grading Workflow  
  QUIZ_GRADING_WEBHOOK: import.meta.env.VITE_QUIZ_GRADING_WEBHOOK || '44d2d27d-4936-4ff2-a808-b6b11679e08b',
  
  // Helper function to get full webhook URLs
  getQuizGenerationUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GENERATION_WEBHOOK}`,
  getQuizGradingUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GRADING_WEBHOOK}`,
}; 