import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("shows 'Lav risiko' for green", () => {
    render(<RiskBadge level="green" />);
    expect(screen.getByText("Lav risiko")).toBeInTheDocument();
  });

  it("shows 'Moderat risiko' for yellow", () => {
    render(<RiskBadge level="yellow" />);
    expect(screen.getByText("Moderat risiko")).toBeInTheDocument();
  });

  it("shows 'Høj risiko' for red", () => {
    render(<RiskBadge level="red" />);
    expect(screen.getByText("Høj risiko")).toBeInTheDocument();
  });

  it("applies large size styling when size=lg", () => {
    const { container } = render(<RiskBadge level="green" size="lg" />);
    expect(container.firstChild).toHaveClass("px-4");
  });
});
