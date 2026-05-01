import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModelV1 } from 'ai';

export interface ProviderConfig {
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  requiresBaseUrl: boolean;
  baseUrl?: string;
  createModel: (apiKey: string, model: string, baseUrl?: string) => LanguageModelV1;
}

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  anthropic: {
    displayName: 'Anthropic',
    defaultModel: 'claude-sonnet-4-6',
    availableModels: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    supportsStructuredOutput: true,
    supportsStreaming: true,
    requiresBaseUrl: false,
    createModel: (apiKey, model) => createAnthropic({ apiKey })(model),
  },
  openai: {
    displayName: 'OpenAI',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
    supportsStructuredOutput: true,
    supportsStreaming: true,
    requiresBaseUrl: false,
    createModel: (apiKey, model) => createOpenAI({ apiKey })(model),
  },
  groq: {
    displayName: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
    ],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    requiresBaseUrl: false,
    createModel: (apiKey, model) => createGroq({ apiKey })(model),
  },
  sumopod: {
    displayName: 'Sumopod',
    defaultModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'claude-3-haiku', 'deepseek-chat'],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    requiresBaseUrl: true,
    baseUrl: 'https://ai.sumopod.com/v1',
    createModel: (apiKey, model, baseUrl) =>
      createOpenAI({ apiKey, baseURL: baseUrl ?? 'https://ai.sumopod.com/v1' })(model),
  },
  ganrouter: {
    displayName: 'GaNRouter',
    defaultModel: 'cc/claude-sonnet-4-6',
    availableModels: [
      // Claude Code — best for PRD writing
      'cc/claude-sonnet-4-6',
      'cc/claude-opus-4-6',
      'cc/claude-opus-4-5-20251101',
      'cc/claude-sonnet-4-5-20250929',
      'cc/claude-haiku-4-5-20251001',
      // OpenAI (non-codex) — good for text generation
      'cx/gpt-5.4',
      'cx/gpt-5.2',
      'cx/gpt-5.1',
      // GitHub Copilot — Claude
      'gh/claude-opus-4.6',
      'gh/claude-sonnet-4.6',
      'gh/claude-sonnet-4.5',
      'gh/claude-opus-4.5',
      // GitHub Copilot — GPT
      'gh/gpt-5',
      'gh/gpt-5.1',
      'gh/gpt-5.2',
      'gh/gpt-5.4',
      'gh/gpt-4o',
      'gh/gpt-4o-mini',
    ],
    supportsStructuredOutput: false,
    supportsStreaming: true,
    requiresBaseUrl: true,
    baseUrl: 'https://ganrouter.com/v1',
    createModel: (apiKey, model, baseUrl) =>
      createOpenAI({ apiKey, baseURL: baseUrl ?? 'https://ganrouter.com/v1' })(model),
  },
};

export type ProviderType = keyof typeof PROVIDER_REGISTRY;
