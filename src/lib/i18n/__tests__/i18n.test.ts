import { describe, expect, it } from "vitest";
import { getDictionary, normalizeLocale, resolveSystemLocale } from "../index";

describe("i18n locale resolution and dictionaries", () => {
  it("resolves Catalan and Spanish system locales including regional variants", () => {
    expect(resolveSystemLocale(["ca-ES", "es-ES", "en-US"])).toBe("ca");
    expect(resolveSystemLocale(["es-419", "en-US"])).toBe("es");
    expect(resolveSystemLocale("ca")).toBe("ca");
    expect(resolveSystemLocale("es_ES")).toBe("es");
  });

  it("falls back to English for unsupported or empty locales", () => {
    expect(resolveSystemLocale(["fr-FR", "de-DE"])).toBe("en");
    expect(resolveSystemLocale([])).toBe("en");
    expect(resolveSystemLocale(null)).toBe("en");
    expect(normalizeLocale("pt-BR")).toBeNull();
  });

  it("returns localized dictionaries for en, es, and ca", () => {
    expect(getDictionary("en").header.openProject).toBe("Open Project");
    expect(getDictionary("es").header.openProject).toBe("Abrir proyecto");
    expect(getDictionary("ca").header.openProject).toBe("Obrir projecte");
  });
});
