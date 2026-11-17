import { vars } from 'nativewind';

/** Semantic colours from docs/design.md, as hex. */
export type ThemeTokens = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  danger: string;
  success: string;
};

export const lightTheme: ThemeTokens = {
  background: '#FFFFFF',
  surface: '#F3F4F6',
  border: '#6B7280',
  text: '#111827',
  textMuted: '#4B5563',
  accent: '#1D4ED8',
  onAccent: '#FFFFFF',
  danger: '#B91C1C',
  success: '#166534',
};

export const darkTheme: ThemeTokens = {
  background: '#111827',
  surface: '#1F2937',
  border: '#9CA3AF',
  text: '#F9FAFB',
  textMuted: '#D1D5DB',
  accent: '#93C5FD',
  onAccent: '#111827',
  danger: '#FCA5A5',
  success: '#86EFAC',
};

/** `#1D4ED8` → `29 78 216`, the channel format tailwind.config.js reads through `rgb(var(--x) / <alpha-value>)`. */
export function toRgbChannels(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

export function toThemeVariables(theme: ThemeTokens) {
  return vars({
    '--background': toRgbChannels(theme.background),
    '--surface': toRgbChannels(theme.surface),
    '--border': toRgbChannels(theme.border),
    '--text': toRgbChannels(theme.text),
    '--text-muted': toRgbChannels(theme.textMuted),
    '--accent': toRgbChannels(theme.accent),
    '--on-accent': toRgbChannels(theme.onAccent),
    '--danger': toRgbChannels(theme.danger),
    '--success': toRgbChannels(theme.success),
  });
}
