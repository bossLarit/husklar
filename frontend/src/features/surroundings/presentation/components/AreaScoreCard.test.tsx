import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { AreaScoreCard } from "./AreaScoreCard";
import type { AreaScores } from "../../domain/entities/surroundings";

const baseScores: AreaScores = {
  transport: 9,
  schools: 6,
  shopping: 7,
  nature: 4,
  crime: null,
  noise: null,
  overall: 5,
};

describe("AreaScoreCard", () => {
  it("displays overall score", () => {
    render(<AreaScoreCard scores={baseScores} />);
    expect(screen.getByText("5/10")).toBeInTheDocument();
  });

  it("renders all five category labels", () => {
    render(<AreaScoreCard scores={baseScores} />);
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Skoler & institutioner")).toBeInTheDocument();
    expect(screen.getByText("Indkøbsmulighed")).toBeInTheDocument();
    expect(screen.getByText("Naturområder")).toBeInTheDocument();
    expect(screen.getByText("Kriminalitet")).toBeInTheDocument();
    expect(screen.queryByText("Støjniveau")).not.toBeInTheDocument();
  });

  it("renders crime help text disclosing kommune-level scope", () => {
    render(
      <AreaScoreCard scores={{ ...baseScores, crime: 7 }} />,
    );
    expect(
      screen.getByText(/Kommuneniveau — ikke dit nærområde/),
    ).toBeInTheDocument();
  });

  it("explains scoring basis with kommune disclosure", () => {
    render(<AreaScoreCard scores={baseScores} />);
    expect(screen.getByText(/OpenStreetMap/)).toBeInTheDocument();
    expect(screen.getByText(/Danmarks Statistik/)).toBeInTheDocument();
  });
});
