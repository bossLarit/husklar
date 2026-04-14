import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { AreaScoreCard } from "./AreaScoreCard";

describe("AreaScoreCard", () => {
  it("displays overall score", () => {
    render(
      <AreaScoreCard
        scores={{ transport: 9, schools: 6, noise: 0, overall: 8 }}
      />,
    );
    // Overall score renders as "8/10" — unique since transport=9, schools=6
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("shows transport and schools but not noise", () => {
    render(
      <AreaScoreCard
        scores={{ transport: 9, schools: 6, noise: 0, overall: 8 }}
      />,
    );
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Skoler & institutioner")).toBeInTheDocument();
    expect(screen.queryByText("Støjniveau")).not.toBeInTheDocument();
  });

  it("explains scoring basis", () => {
    render(
      <AreaScoreCard
        scores={{ transport: 5, schools: 5, noise: 0, overall: 5 }}
      />,
    );
    expect(screen.getByText(/OpenStreetMap/)).toBeInTheDocument();
  });
});
