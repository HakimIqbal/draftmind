export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          resource_id: string | null;
          resource_type: string | null;
          type: Database['public']['Enums']['activity_type'];
          workspace_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string | null;
          type: Database['public']['Enums']['activity_type'];
          workspace_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          resource_id?: string | null;
          resource_type?: string | null;
          type?: Database['public']['Enums']['activity_type'];
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activity_log_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_review_findings: {
        Row: {
          ai_run_id: string;
          created_at: string;
          description: string;
          dismissed_at: string | null;
          dismissed_by: string | null;
          fix_applied_at: string | null;
          fix_applied_by: string | null;
          id: string;
          prd_id: string;
          section_key: string;
          severity: Database['public']['Enums']['finding_severity'];
          suggested_fix: string | null;
          title: string;
        };
        Insert: {
          ai_run_id: string;
          created_at?: string;
          description: string;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          fix_applied_at?: string | null;
          fix_applied_by?: string | null;
          id?: string;
          prd_id: string;
          section_key: string;
          severity: Database['public']['Enums']['finding_severity'];
          suggested_fix?: string | null;
          title: string;
        };
        Update: {
          ai_run_id?: string;
          created_at?: string;
          description?: string;
          dismissed_at?: string | null;
          dismissed_by?: string | null;
          fix_applied_at?: string | null;
          fix_applied_by?: string | null;
          id?: string;
          prd_id?: string;
          section_key?: string;
          severity?: Database['public']['Enums']['finding_severity'];
          suggested_fix?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_review_findings_ai_run_id_fkey';
            columns: ['ai_run_id'];
            isOneToOne: false;
            referencedRelation: 'ai_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_review_findings_dismissed_by_fkey';
            columns: ['dismissed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_review_findings_fix_applied_by_fkey';
            columns: ['fix_applied_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_review_findings_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_runs: {
        Row: {
          completed_at: string | null;
          completion_tokens: number | null;
          cost_credits: number | null;
          created_at: string;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          input_payload: Json | null;
          metadata: Json;
          model_used: string;
          output_payload: Json | null;
          prd_id: string | null;
          prompt_tokens: number | null;
          provider_id: string | null;
          status: Database['public']['Enums']['ai_run_status'];
          total_tokens: number | null;
          type: Database['public']['Enums']['ai_run_type'];
          user_id: string | null;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completion_tokens?: number | null;
          cost_credits?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          input_payload?: Json | null;
          metadata?: Json;
          model_used: string;
          output_payload?: Json | null;
          prd_id?: string | null;
          prompt_tokens?: number | null;
          provider_id?: string | null;
          status?: Database['public']['Enums']['ai_run_status'];
          total_tokens?: number | null;
          type: Database['public']['Enums']['ai_run_type'];
          user_id?: string | null;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          completion_tokens?: number | null;
          cost_credits?: number | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          input_payload?: Json | null;
          metadata?: Json;
          model_used?: string;
          output_payload?: Json | null;
          prd_id?: string | null;
          prompt_tokens?: number | null;
          provider_id?: string | null;
          status?: Database['public']['Enums']['ai_run_status'];
          total_tokens?: number | null;
          type?: Database['public']['Enums']['ai_run_type'];
          user_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_runs_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_runs_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_runs_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers_safe';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_runs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_runs_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_ai_generated: boolean;
          mentions: string[] | null;
          parent_id: string | null;
          prd_id: string;
          reactions: Json;
          resolved_at: string | null;
          resolved_by: string | null;
          section_key: string | null;
          selection_range: Json | null;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_ai_generated?: boolean;
          mentions?: string[] | null;
          parent_id?: string | null;
          prd_id: string;
          reactions?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          section_key?: string | null;
          selection_range?: Json | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_ai_generated?: boolean;
          mentions?: string[] | null;
          parent_id?: string | null;
          prd_id?: string;
          reactions?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          section_key?: string | null;
          selection_range?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          resource_id: string | null;
          resource_type: string | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          workspace_id: string | null;
        };
        Insert: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          resource_id?: string | null;
          resource_type?: string | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          workspace_id?: string | null;
        };
        Update: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          resource_id?: string | null;
          resource_type?: string | null;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      prd_sections: {
        Row: {
          content: Json;
          health_score: number | null;
          prd_id: string;
          section_key: string;
          updated_at: string;
          word_count: number;
        };
        Insert: {
          content: Json;
          health_score?: number | null;
          prd_id: string;
          section_key: string;
          updated_at?: string;
          word_count?: number;
        };
        Update: {
          content?: Json;
          health_score?: number | null;
          prd_id?: string;
          section_key?: string;
          updated_at?: string;
          word_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'prd_sections_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
        ];
      };
      prd_shares: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          prd_id: string;
          share_token: string;
          view_count: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          prd_id: string;
          share_token: string;
          view_count?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          prd_id?: string;
          share_token?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'prd_shares_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prd_shares_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
        ];
      };
      prd_templates: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          is_built_in: boolean;
          name: string;
          structure: Json;
          use_count: number;
          workspace_id: string | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_built_in?: boolean;
          name: string;
          structure: Json;
          use_count?: number;
          workspace_id?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_built_in?: boolean;
          name?: string;
          structure?: Json;
          use_count?: number;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prd_templates_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      prd_versions: {
        Row: {
          ai_run_id: string | null;
          change_summary: string | null;
          content: Json;
          created_at: string;
          created_by: string | null;
          diff_from_previous: Json | null;
          id: string;
          prd_id: string;
          source: string;
          version_number: number;
        };
        Insert: {
          ai_run_id?: string | null;
          change_summary?: string | null;
          content: Json;
          created_at?: string;
          created_by?: string | null;
          diff_from_previous?: Json | null;
          id?: string;
          prd_id: string;
          source: string;
          version_number: number;
        };
        Update: {
          ai_run_id?: string | null;
          change_summary?: string | null;
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          diff_from_previous?: Json | null;
          id?: string;
          prd_id?: string;
          source?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'prd_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prd_versions_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
        ];
      };
      prds: {
        Row: {
          archived_at: string | null;
          content: Json;
          created_at: string;
          current_version: number;
          health_breakdown: Json | null;
          health_score: number | null;
          id: string;
          is_pinned: boolean;
          metadata: Json;
          owner_id: string;
          project_tag: string | null;
          read_time_minutes: number;
          readability_score: string | null;
          status: Database['public']['Enums']['prd_status'];
          template_id: string | null;
          tiptap_content: Json | null;
          title: string;
          updated_at: string;
          word_count: number;
          workspace_id: string;
        };
        Insert: {
          archived_at?: string | null;
          content: Json;
          created_at?: string;
          current_version?: number;
          health_breakdown?: Json | null;
          health_score?: number | null;
          id?: string;
          is_pinned?: boolean;
          metadata?: Json;
          owner_id: string;
          project_tag?: string | null;
          read_time_minutes?: number;
          readability_score?: string | null;
          status?: Database['public']['Enums']['prd_status'];
          template_id?: string | null;
          tiptap_content?: Json | null;
          title: string;
          updated_at?: string;
          word_count?: number;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          content?: Json;
          created_at?: string;
          current_version?: number;
          health_breakdown?: Json | null;
          health_score?: number | null;
          id?: string;
          is_pinned?: boolean;
          metadata?: Json;
          owner_id?: string;
          project_tag?: string | null;
          read_time_minutes?: number;
          readability_score?: string | null;
          status?: Database['public']['Enums']['prd_status'];
          template_id?: string | null;
          tiptap_content?: Json | null;
          title?: string;
          updated_at?: string;
          word_count?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prds_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prds_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'prd_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prds_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_color_seed: string | null;
          avatar_initials: string | null;
          created_at: string;
          default_locale: string;
          email: string;
          experience_level: string | null;
          full_name: string | null;
          id: string;
          onboarding_completed_at: string | null;
          primary_use_cases: string[] | null;
          role_self_reported: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_color_seed?: string | null;
          avatar_initials?: string | null;
          created_at?: string;
          default_locale?: string;
          email: string;
          experience_level?: string | null;
          full_name?: string | null;
          id: string;
          onboarding_completed_at?: string | null;
          primary_use_cases?: string[] | null;
          role_self_reported?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_color_seed?: string | null;
          avatar_initials?: string | null;
          created_at?: string;
          default_locale?: string;
          email?: string;
          experience_level?: string | null;
          full_name?: string | null;
          id?: string;
          onboarding_completed_at?: string | null;
          primary_use_cases?: string[] | null;
          role_self_reported?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          api_key_encrypted: string;
          available_models: string[];
          base_url: string | null;
          created_at: string;
          created_by: string | null;
          default_model: string;
          display_name: string;
          id: string;
          is_default: boolean;
          last_used_at: string | null;
          status: Database['public']['Enums']['provider_status'];
          status_reason: string | null;
          type: Database['public']['Enums']['provider_type'];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          api_key_encrypted: string;
          available_models?: string[];
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_model: string;
          display_name: string;
          id?: string;
          is_default?: boolean;
          last_used_at?: string | null;
          status?: Database['public']['Enums']['provider_status'];
          status_reason?: string | null;
          type: Database['public']['Enums']['provider_type'];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          api_key_encrypted?: string;
          available_models?: string[];
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_model?: string;
          display_name?: string;
          id?: string;
          is_default?: boolean;
          last_used_at?: string | null;
          status?: Database['public']['Enums']['provider_status'];
          status_reason?: string | null;
          type?: Database['public']['Enums']['provider_type'];
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'providers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'providers_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      workspace_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          revoked_at: string | null;
          role: Database['public']['Enums']['workspace_role'];
          token: string;
          workspace_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database['public']['Enums']['workspace_role'];
          token: string;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database['public']['Enums']['workspace_role'];
          token?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_invitations_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      workspace_members: {
        Row: {
          joined_at: string;
          last_active_at: string | null;
          role: Database['public']['Enums']['workspace_role'];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          joined_at?: string;
          last_active_at?: string | null;
          role?: Database['public']['Enums']['workspace_role'];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          joined_at?: string;
          last_active_at?: string | null;
          role?: Database['public']['Enums']['workspace_role'];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          icon_custom_url: string | null;
          icon_pattern: string;
          id: string;
          industry: string | null;
          is_private: boolean;
          name: string;
          owner_id: string;
          slug: string;
          team_size: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          icon_custom_url?: string | null;
          icon_pattern?: string;
          id?: string;
          industry?: string | null;
          is_private?: boolean;
          name: string;
          owner_id: string;
          slug: string;
          team_size?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          icon_custom_url?: string | null;
          icon_pattern?: string;
          id?: string;
          industry?: string | null;
          is_private?: boolean;
          name?: string;
          owner_id?: string;
          slug?: string;
          team_size?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      providers_safe: {
        Row: {
          available_models: string[] | null;
          base_url: string | null;
          created_at: string | null;
          created_by: string | null;
          default_model: string | null;
          display_name: string | null;
          id: string | null;
          is_default: boolean | null;
          last_used_at: string | null;
          status: Database['public']['Enums']['provider_status'] | null;
          status_reason: string | null;
          type: Database['public']['Enums']['provider_type'] | null;
          updated_at: string | null;
          workspace_id: string | null;
        };
        Insert: {
          available_models?: string[] | null;
          base_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_model?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_default?: boolean | null;
          last_used_at?: string | null;
          status?: Database['public']['Enums']['provider_status'] | null;
          status_reason?: string | null;
          type?: Database['public']['Enums']['provider_type'] | null;
          updated_at?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          available_models?: string[] | null;
          base_url?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_model?: string | null;
          display_name?: string | null;
          id?: string | null;
          is_default?: boolean | null;
          last_used_at?: string | null;
          status?: Database['public']['Enums']['provider_status'] | null;
          status_reason?: string | null;
          type?: Database['public']['Enums']['provider_type'] | null;
          updated_at?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'providers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'providers_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      has_workspace_role: {
        Args: {
          _roles: Database['public']['Enums']['workspace_role'][];
          _workspace_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      activity_type:
        | 'prd_created'
        | 'prd_edited'
        | 'prd_status_changed'
        | 'prd_exported'
        | 'comment_added'
        | 'comment_resolved'
        | 'review_requested'
        | 'review_approved'
        | 'review_rejected'
        | 'ai_generation_completed'
        | 'ai_review_completed'
        | 'ai_refinement_applied'
        | 'member_invited'
        | 'member_joined'
        | 'member_role_changed'
        | 'member_removed'
        | 'workspace_created'
        | 'workspace_settings_changed'
        | 'provider_added'
        | 'provider_disconnected'
        | 'login'
        | 'logout'
        | 'public_share_created'
        | 'public_share_viewed';
      ai_run_status: 'queued' | 'running' | 'success' | 'error' | 'cancelled';
      ai_run_type:
        | 'generate_prd'
        | 'refine_section'
        | 'regenerate_prd'
        | 'ai_review'
        | 'inline_suggest'
        | 'quick_action';
      finding_severity: 'high' | 'medium' | 'low';
      notification_type:
        | 'mention'
        | 'review_request'
        | 'approval_needed'
        | 'comment_reply'
        | 'ai_suggestion_ready'
        | 'integration_event'
        | 'workspace_invite';
      prd_status:
        | 'draft'
        | 'in_review'
        | 'reviewed'
        | 'refined'
        | 'final'
        | 'blocked'
        | 'approved'
        | 'shipped'
        | 'archived';
      provider_status: 'active' | 'disconnected' | 'error';
      provider_type:
        | 'anthropic'
        | 'openai'
        | 'gemini'
        | 'groq'
        | 'sumopod'
        | 'ganrouter'
        | 'custom';
      workspace_role: 'admin' | 'editor' | 'commenter' | 'viewer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        'prd_created',
        'prd_edited',
        'prd_status_changed',
        'prd_exported',
        'comment_added',
        'comment_resolved',
        'review_requested',
        'review_approved',
        'review_rejected',
        'ai_generation_completed',
        'ai_review_completed',
        'ai_refinement_applied',
        'member_invited',
        'member_joined',
        'member_role_changed',
        'member_removed',
        'workspace_created',
        'workspace_settings_changed',
        'provider_added',
        'provider_disconnected',
        'login',
        'logout',
        'public_share_created',
        'public_share_viewed',
      ],
      ai_run_status: ['queued', 'running', 'success', 'error', 'cancelled'],
      ai_run_type: [
        'generate_prd',
        'refine_section',
        'regenerate_prd',
        'ai_review',
        'inline_suggest',
        'quick_action',
      ],
      finding_severity: ['high', 'medium', 'low'],
      notification_type: [
        'mention',
        'review_request',
        'approval_needed',
        'comment_reply',
        'ai_suggestion_ready',
        'integration_event',
        'workspace_invite',
      ],
      prd_status: [
        'draft',
        'in_review',
        'reviewed',
        'refined',
        'final',
        'blocked',
        'approved',
        'shipped',
        'archived',
      ],
      provider_status: ['active', 'disconnected', 'error'],
      provider_type: ['anthropic', 'openai', 'gemini', 'groq', 'sumopod', 'ganrouter', 'custom'],
      workspace_role: ['admin', 'editor', 'commenter', 'viewer'],
    },
  },
} as const;
