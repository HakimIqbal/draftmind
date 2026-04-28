export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'groq'
  | 'sumopod'
  | 'ganrouter'
  | 'custom';
export type ProviderStatus = 'active' | 'disconnected' | 'error';

export interface Provider {
  id: string;
  workspace_id: string;
  type: ProviderType;
  display_name: string;
  base_url: string | null;
  default_model: string;
  available_models: string[];
  is_default: boolean;
  status: ProviderStatus;
  status_reason: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}
