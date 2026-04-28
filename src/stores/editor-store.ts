import { create } from 'zustand';

interface EditorState {
  outlineCollapsed: boolean;
  copilotCollapsed: boolean;
  activeOutlineTab: 'outline' | 'comments' | 'info';
  markdownMode: boolean;
  aiAssistMode: boolean;
  aiAssistSelectedText: string;

  toggleOutline: () => void;
  toggleCopilot: () => void;
  setOutlineTab: (tab: 'outline' | 'comments' | 'info') => void;
  setMarkdownMode: (v: boolean) => void;
  expandOutline: (tab?: 'outline' | 'comments' | 'info') => void;
  expandCopilot: () => void;
  openAIAssist: (selectedText: string) => void;
  closeAIAssist: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  outlineCollapsed: false,
  copilotCollapsed: false,
  activeOutlineTab: 'outline',
  markdownMode: false,
  aiAssistMode: false,
  aiAssistSelectedText: '',

  toggleOutline: () => set((s) => ({ outlineCollapsed: !s.outlineCollapsed })),
  toggleCopilot: () => set((s) => ({ copilotCollapsed: !s.copilotCollapsed })),
  setOutlineTab: (tab) => set({ activeOutlineTab: tab }),
  setMarkdownMode: (v) => set({ markdownMode: v }),
  expandOutline: (tab) => set({ outlineCollapsed: false, activeOutlineTab: tab ?? 'outline' }),
  expandCopilot: () => set({ copilotCollapsed: false }),
  openAIAssist: (selectedText) =>
    set({ aiAssistMode: true, aiAssistSelectedText: selectedText, copilotCollapsed: false }),
  closeAIAssist: () => set({ aiAssistMode: false, aiAssistSelectedText: '' }),
}));
