'use client';

/**
 * Selection detector hook — previously auto-opened AI Assist panel on
 * text selection > 10 chars. That behavior caused the inline comment
 * popover to be hidden (aiAssistMode = true hid it).
 *
 * Now the AI Assist panel is only opened via the bubble toolbar button.
 * This file is kept for backward compatibility but the hook is a no-op.
 */
export function useSelectionDetector() {
  // No-op — selection handling is now done by BubbleToolbar
}
