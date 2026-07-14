import { parseListText } from './shopping-list.service';

describe('parseListText', () => {
  it('parses plain lines and bullets', () => {
    const raw = `- Leche\n* Pan\n1. Huevos\n✅ Aceite\n`;
    expect(parseListText(raw)).toEqual(['Leche', 'Pan', 'Huevos', 'Aceite']);
  });

  it('strips WhatsApp-like prefixes', () => {
    const raw = `[20:15, 14/7/2026] Sofi: Yogur\n[20:16, 14/7/2026] Gonza: Café`;
    expect(parseListText(raw)).toEqual(['Yogur', 'Café']);
  });
});
