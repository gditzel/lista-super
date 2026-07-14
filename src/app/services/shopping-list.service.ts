import { Injectable, computed, effect, signal } from '@angular/core';
import { ShoppingItem } from '../models/shopping-item';

const STORAGE_KEY = 'lista-super.items.v1';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly itemsSignal = signal<ShoppingItem[]>(this.load());

  readonly items = this.itemsSignal.asReadonly();
  readonly pendingCount = computed(() => this.itemsSignal().filter((i) => !i.checked).length);
  readonly checkedCount = computed(() => this.itemsSignal().filter((i) => i.checked).length);
  readonly estimatedTotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => {
      if (item.unitPrice == null) return sum;
      return sum + item.unitPrice * item.quantity;
    }, 0)
  );
  readonly pricedCount = computed(
    () => this.itemsSignal().filter((i) => i.unitPrice != null).length
  );

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsSignal()));
    });
  }

  addItem(name: string, quantity = 1, unitPrice: number | null = null): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      quantity: Math.max(1, quantity),
      unitPrice,
      checked: false,
      createdAt: Date.now(),
    };

    this.itemsSignal.update((items) => [item, ...items]);
  }

  importFromText(raw: string): number {
    const names = parseListText(raw);
    if (!names.length) return 0;

    const existing = new Set(
      this.itemsSignal().map((item) => normalizeName(item.name))
    );

    const fresh = names.filter((name) => !existing.has(normalizeName(name)));
    fresh.forEach((name) => this.addItem(name));
    return fresh.length;
  }

  toggleChecked(id: string): void {
    this.itemsSignal.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  updateName(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === id ? { ...item, name: trimmed } : item))
    );
  }

  updateQuantity(id: string, quantity: number): void {
    const safe = Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: safe } : item))
    );
  }

  updateUnitPrice(id: string, unitPrice: number | null): void {
    const value =
      unitPrice == null || !Number.isFinite(unitPrice) || unitPrice < 0
        ? null
        : Math.round(unitPrice * 100) / 100;

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === id ? { ...item, unitPrice: value } : item))
    );
  }

  removeItem(id: string): void {
    this.itemsSignal.update((items) => items.filter((item) => item.id !== id));
  }

  clearChecked(): void {
    this.itemsSignal.update((items) => items.filter((item) => !item.checked));
  }

  clearAll(): void {
    this.itemsSignal.set([]);
  }

  private load(): ShoppingItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ShoppingItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Parses WhatsApp / plain-text grocery lists into item names. */
export function parseListText(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter((line): line is string => Boolean(line));

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const key = normalizeName(line);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
  }

  return unique;
}

function cleanLine(line: string): string | null {
  let text = line.trim();
  if (!text) return null;

  // Strip WhatsApp timestamps / author prefixes: "[12:30, 14/7/2026] Nombre:"
  text = text.replace(/^\[.*?\]\s*[^:]{1,40}:\s*/u, '');

  // Strip common list markers and checkboxes
  text = text
    .replace(/^[-*•◦▪▸➤→]+\s*/u, '')
    .replace(/^(?:✅|☑|✔|❌|☐|□|❑|\[(?: |x|X|✓)?\])\s*/u, '')
    .replace(/^\d+[\).:\-]\s*/u, '')
    .trim();

  if (!text || text.length < 2) return null;
  // Ignore short conversational leftovers
  if (/^(jajaja+|ok|dale|listo|gracias|si|sí|no)\.?$/iu.test(text)) return null;

  return text;
}
