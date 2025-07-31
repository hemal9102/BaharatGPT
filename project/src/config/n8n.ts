// n8n Workflow Configuration
export const N8N_CONFIG = {
  // Replace these URLs with your actual n8n instance URLs
  BASE_URL: 'https://your-n8n-instance.com',
  
  // Quiz Generation Workflow
  QUIZ_GENERATION_WEBHOOK: '2e31fb8e-9f79-45b0-b40f-aa297c3d3294',
  
  // Quiz Grading Workflow  
  QUIZ_GRADING_WEBHOOK: '44d2d27d-4936-4ff2-a808-b6b11679e08b',
  
  // Helper function to get full webhook URLs
  getQuizGenerationUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GENERATION_WEBHOOK}`,
  getQuizGradingUrl: () => `${N8N_CONFIG.BASE_URL}/webhook/${N8N_CONFIG.QUIZ_GRADING_WEBHOOK}`,
}; 