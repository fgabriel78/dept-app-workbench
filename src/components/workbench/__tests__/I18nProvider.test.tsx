import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, LOCALE_STORAGE_KEY, useI18n } from "../I18nProvider";

function Probe() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="open-label">{t.header.openProject}</span>
      <button type="button" onClick={() => setLocale("es")}>
        Switch ES
      </button>
    </div>
  );
}

describe("I18nProvider", () => {
  const originalLanguages = navigator.languages;
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => (key in store ? store[key] : null),
        setItem: (key: string, value: string) => {
          store[key] = String(value);
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "languages", {
      value: originalLanguages,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("detects system locale on mount and persists manual overrides", async () => {
    Object.defineProperty(navigator, "languages", {
      value: ["ca-ES", "es-ES"],
      configurable: true,
    });

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("ca");
    });
    expect(screen.getByTestId("open-label")).toHaveTextContent("Obrir projecte");
    expect(document.documentElement.lang).toBe("ca");

    await user.click(screen.getByRole("button", { name: "Switch ES" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("open-label")).toHaveTextContent("Abrir proyecto");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
  });
});
