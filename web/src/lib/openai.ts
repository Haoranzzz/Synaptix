import OpenAI from 'openai';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL;

export const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  dangerouslyAllowBrowser: true // For prototype, usually should be called from backend
});

export const AI_MODEL = import.meta.env.VITE_AI_MODEL;
