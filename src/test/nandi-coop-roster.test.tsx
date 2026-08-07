import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NandiCoopRoster } from "@/components/nandi/NandiCoopRoster";

const farmers = [
  { id: "f1", name: "Aisha Ng'etich", initials: "AN", note: null, sort_order: 1 },
  { id: "f2", name: "Joseph Kiprop", initials: "JK", note: null, sort_order: 2 },
];
const contributions = [
  { id: "c1", label: "Main crop delivery · Lot KMT-2024-007", occurred_on: "2024-03-14", amount_ksh: 62000, status: "Pending", proof_note: "p1", farmer_id: "f1" },
  { id: "c2", label: "Fermentation technique · Kabitet licence", occurred_on: "2023-04-14", amount_ksh: 14200, status: "Received", proof_note: "p2", farmer_id: "f1" },
  { id: "c3", label: "Main crop delivery · Lot KMT-2023-033", occurred_on: "2023-03-19", amount_ksh: 49500, status: "Received", proof_note: "p3", farmer_id: "f2" },
];

describe("NandiCoopRoster", () => {
  it("renders roster aggregates sorted by received desc", () => {
    render(<NandiCoopRoster farmers={farmers} contributions={contributions} />);
    expect(screen.getByText(/Membership roster · 2 farmers/)).toBeTruthy();
    expect(screen.getByText("KSh 49,500")).toBeTruthy();
    expect(screen.getByText("KSh 62,000")).toBeTruthy();
    const rows = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    expect(rows.findIndex((t) => t.includes("Joseph"))).toBeLessThan(rows.findIndex((t) => t.includes("Aisha")));
  });

  it("drills down per farmer", () => {
    render(<NandiCoopRoster farmers={farmers} contributions={contributions} />);
    fireEvent.click(screen.getByText("Aisha Ng'etich"));
    expect(screen.getByText(/Lot KMT-2024-007/)).toBeTruthy();
    fireEvent.click(screen.getByText("Joseph Kiprop"));
    expect(screen.getByText(/Lot KMT-2023-033/)).toBeTruthy();
  });

  it("toggles transactions and grouping by type", () => {
    render(<NandiCoopRoster farmers={farmers} contributions={contributions} />);
    fireEvent.click(screen.getByRole("button", { name: /All transactions/i }));
    expect(screen.getAllByText(/Lot KMT-2024-007/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /By type/i }));
    expect(screen.getByText(/Main crop delivery · 2 entries/)).toBeTruthy();
    expect(screen.getByText(/Fermentation technique · 1 entries/)).toBeTruthy();
    expect(screen.getByText("KSh 111,500")).toBeTruthy();
  });
});
