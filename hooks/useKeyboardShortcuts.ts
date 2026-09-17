'use client';

import { useEffect, useRef } from 'react';

export type ShortcutHandlers = Record<string, () => void>;

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

export function eventToCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.metaKey) parts.push('Meta');

  const key = event.key;
  const isPrintable = key.length === 1;

  if (event.shiftKey && !isPrintable) parts.push('Shift');

  if (event.shiftKey && isPrintable) {
    const upper = key.toUpperCase();
    if (upper !== key.toLowerCase() || key === key.toUpperCase()) {
      parts.push('Shift');
      parts.push(upper);
      return parts.join('+');
    }
  }

  parts.push(isPrintable ? key.toLowerCase() : key);
  return parts.join('+');
}

function normalizeBinding(binding: string): string {
  const parts = binding.split('+');
  const key = parts.pop() ?? '';
  const modifiers = parts;
  const normalizedKey = key.length === 1 && !modifiers.includes('Shift') ? key.toLowerCase() : key;
  return [...modifiers, normalizedKey].join('+');
}

export function useKeyboardShortcuts(
  keybindings: Record<string, string>,
  handlers: ShortcutHandlers,
  enabled = true
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const bindingsRef = useRef(keybindings);
  bindingsRef.current = keybindings;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      const combo = eventToCombo(event);
      const lookup = new Map<string, string>();
      for (const [action, binding] of Object.entries(bindingsRef.current)) {
        lookup.set(normalizeBinding(binding), action);
      }

      const action = lookup.get(combo) ?? lookup.get(normalizeBinding(event.key));
      if (!action) return;

      const handler = handlersRef.current[action];
      if (!handler) return;

      event.preventDefault();
      event.stopPropagation();
      handler();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
