import OpenAI from 'openai';

// Default values from environment variables
const ENV_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ENV_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || '';

// Helper to determine the default model based on the provider
const getDefaultModel = (baseUrl: string) => {
  if (baseUrl?.includes('dashscope')) return 'qwen-turbo';
  if (baseUrl?.includes('deepseek')) return 'deepseek-chat';
  return 'gpt-3.5-turbo';
};

export const getAIConfig = () => {
  const apiKey = localStorage.getItem('ai_api_key') || ENV_API_KEY;
  const baseUrl = localStorage.getItem('ai_base_url') || ENV_BASE_URL;
  const defaultModel = getDefaultModel(baseUrl);
  const model = localStorage.getItem('ai_model') || import.meta.env.VITE_AI_MODEL || defaultModel;
  
  return { apiKey, baseUrl, model };
};

export const getOpenAIClient = () => {
  const { apiKey, baseUrl } = getAIConfig();
  
  return new OpenAI({
    apiKey: apiKey || 'dummy-key-to-prevent-error',
    baseURL: baseUrl || undefined,
    dangerouslyAllowBrowser: true // For prototype, usually should be called from backend
  });
};

