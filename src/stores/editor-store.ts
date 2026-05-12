import { create } from 'zustand';

interface EditorState {
  outlineCollapsed: boolean;
  copilotCollapsed: boolean;
  activeOutlineTab: 'outline' | 'comments' | 'info';
  markdownMode: boolean;
  aiAssistMode: boolean;
  aiAssistSelectedText: string;
  aiAssistSelectionRange: { from: number; to: number } | null;

  toggleOutline: () => void;
  toggleCopilot: () => void;
  setOutlineTab: (tab: 'outline' | 'comments' | 'info') => void;
  setMarkdownMode: (v: boolean) => void;
  expandOutline: (tab?: 'outline' | 'comments' | 'info') => void;
  expandCopilot: () => void;
  openAIAssist: (selectedText: string, range?: { from: number; to: number }) => void;
  closeAIAssist: () => void;
  collapseAllPanels: () => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  outlineCollapsed: false,
  copilotCollapsed: false,
  activeOutlineTab: 'outline',
  markdownMode: false,
  aiAssistMode: false,
  aiAssistSelectedText: '',
  aiAssistSelectionRange: null,

  toggleOutline: () => set((s) => ({ outlineCollapsed: !s.outlineCollapsed })),
  toggleCopilot: () => set((s) => ({ copilotCollapsed: !s.copilotCollapsed })),
  setOutlineTab: (tab) => set({ activeOutlineTab: tab }),
  setMarkdownMode: (v) => set({ markdownMode: v }),
  expandOutline: (tab) => set({ outlineCollapsed: false, activeOutlineTab: tab ?? 'outline' }),
  expandCopilot: () => set({ copilotCollapsed: false }),
  openAIAssist: (selectedText, range) =>
    set({
      aiAssistMode: true,
      aiAssistSelectedText: selectedText,
      aiAssistSelectionRange: range ?? null,
      copilotCollapsed: false,
    }),
  closeAIAssist: () =>
    set({ aiAssistMode: false, aiAssistSelectedText: '', aiAssistSelectionRange: null }),
  collapseAllPanels: () => set({ outlineCollapsed: true, copilotCollapsed: true }),
  currentSection: 'unknown',
  setCurrentSection: (section) => set({ currentSection: section }),
}));
