import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModelV1 } from 'ai';

export interface ProviderConfig {
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  createModel: (apiKey: string, model: string, baseUrl?: string) => LanguageModelV1;
}

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  anthropic: {
    displayName: 'Anthropic',
    defaultModel: 'claude-sonnet-4-6',
    availableModels: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    supportsStructuredOutput: true,
    supportsStreaming: true,
    createModel: (apiKey, model) => createAnthropic({ apiKey })(model),
  },
  openai: {
    displayName: 'OpenAI',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
    supportsStructuredOutput: true,
    supportsStreaming: true,
    createModel: (apiKey, model) => createOpenAI({ apiKey })(model),
  },
  gemini: {
    displayName: 'Google Gemini',
    defaultModel: 'gemini-1.5-pro',
    availableModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    supportsStructuredOutput: true,
    supportsStreaming: true,
    createModel: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
  },
  groq: {
    displayName: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    createModel: (apiKey, model) => createGroq({ apiKey })(model),
  },
  sumopod: {
    displayName: 'Sumopod',
    defaultModel: 'sumopod-xl-v2',
    availableModels: ['sumopod-xl-v2', 'sumopod-base'],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    createModel: (apiKey, model, baseUrl) =>
      createOpenAI({ apiKey, baseURL: baseUrl ?? '' })(model),
  },
  ganrouter: {
    displayName: 'GaNRouter',
    defaultModel: 'gan-route-v1',
    availableModels: ['gan-route-v1'],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    createModel: (apiKey, model, baseUrl) =>
      createOpenAI({ apiKey, baseURL: baseUrl ?? '' })(model),
  },
};

export type ProviderType = keyof typeof PROVIDER_REGISTRY;
