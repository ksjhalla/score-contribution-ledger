import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DemoProfileCards } from "@/components/demo/DemoProfileCards";
import { DemoProvider } from "@/contexts/DemoContext";

const wrap = (ui: React.ReactNode) => (
  <MemoryRouter>
    <DemoProvider>{ui}</DemoProvider>
  </MemoryRouter>
);

describe("DemoProfileCards FAQ disclosure", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    warnSpy.mockRestore();
  });

  it("renders the FAQ disclosure collapsed by default", () => {
    render(wrap(<DemoProfileCards />));
    const details = screen.getByText("About these demo profiles").closest("details");
    expect(details).toBeTruthy();
    expect(details?.open).toBe(false);
  });

  it("expands and collapses when the summary is clicked", () => {
    render(wrap(<DemoProfileCards />));
    const summary = screen.getByText("About these demo profiles").closest("summary");
    expect(summary).toBeTruthy();

    const details = summary?.closest("details");
    expect(details?.open).toBe(false);

    fireEvent.click(summary!);
    expect(details?.open).toBe(true);

    fireEvent.click(summary!);
    expect(details?.open).toBe(false);
  });

  it("shows all four Q&A pairs and links to /coffee and /#cta", () => {
    render(wrap(<DemoProfileCards />));
    const summary = screen.getByText("About these demo profiles").closest("summary");
    fireEvent.click(summary!);

    expect(screen.getByText(/Is this real data?/)).toBeTruthy();
    expect(screen.getByText(/Why does only some profiles have a Wallet tab?/)).toBeTruthy();
    expect(screen.getByText(/How is this different from the Nandi coffee pilot?/)).toBeTruthy();
    expect(screen.getByText(/Can I try this with my own data?/)).toBeTruthy();

    const caseStudyLink = screen.getByText("case study") as HTMLAnchorElement;
    expect(caseStudyLink.href).toContain("/coffee");

    const requestDemoLink = screen.getByText("request a demo") as HTMLAnchorElement;
    expect(requestDemoLink.href).toContain("/#cta");
  });
});
