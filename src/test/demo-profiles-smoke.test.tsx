import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoPassportView } from "@/components/demo/DemoPassportView";
import { demoProfiles, type DemoKey } from "@/data/demoProfiles";

const KEYS: DemoKey[] = ["pharma", "ncaa", "supplyChain", "ai", "ppp", "agri"];

const wrap = (ui: React.ReactNode) => (
  <HelmetProvider>
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

describe("demo profiles smoke", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("registers every DemoKey in demoProfiles", () => {
    for (const k of KEYS) {
      expect(demoProfiles[k], `missing profile for ${k}`).toBeTruthy();
      expect(demoProfiles[k].contributor.name).toBeTruthy();
    }
  });

  it.each(KEYS)("renders %s passport without console errors", (key) => {
    const profile = demoProfiles[key];
    const { container } = render(wrap(<DemoPassportView profile={profile} />));
    expect(container.textContent).toContain(profile.contributor.name);
    const errors = errSpy.mock.calls.filter(
      (c) => !String(c[0] ?? "").includes("Not implemented: HTMLCanvasElement"),
    );
    expect(errors, `console errors for ${key}: ${JSON.stringify(errors)}`).toHaveLength(0);
  });
});