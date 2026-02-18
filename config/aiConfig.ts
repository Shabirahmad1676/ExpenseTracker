import Groq from "groq-sdk";

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native/Expo 
});