import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card from "../components/Card";
import DomainBars from "../components/DomainBars";
import SignalBadge from "../components/SignalBadge";
import type { DomainKey } from "../domain/model";

describe("UI Components", () => {
  describe("Card", () => {
    it("renders title, right node, and children", () => {
      render(
        <Card title="Card Title" right={<span data-testid="right-node">Right Content</span>}>
          <p>Card Body</p>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByTestId("right-node")).toHaveTextContent("Right Content");
      expect(screen.getByText("Card Body")).toBeInTheDocument();
    });

    it("renders without header when title and right are absent", () => {
      const { container } = render(
        <Card>
          <p>Bare Body</p>
        </Card>
      );

      expect(container.querySelector(".card__header")).toBeNull();
      expect(screen.getByText("Bare Body")).toBeInTheDocument();
    });
  });

  describe("DomainBars", () => {
    it("renders bar rows for all domains with score labels", () => {
      const scores: Record<DomainKey, number> = {
        awareness: 4, // Strong
        coagency: 2, // Developing
        practice: 1, // Low
        ethics: 3.5, // Strong
        governance: 0, // Low
        renewal: 2.5, // Developing
      };

      render(<DomainBars scores={scores} />);

      expect(screen.getByText("Awareness & Orientation")).toBeInTheDocument();
      expect(screen.getByText("4/4")).toBeInTheDocument();
      expect(screen.getByText("2/4")).toBeInTheDocument();
      expect(screen.getByText("1/4")).toBeInTheDocument();
      expect(screen.getByText("0/4")).toBeInTheDocument();

      // Check score badges
      const strongBadges = screen.getAllByText("Strong");
      expect(strongBadges.length).toBeGreaterThanOrEqual(1);

      const devBadges = screen.getAllByText("Developing");
      expect(devBadges.length).toBeGreaterThanOrEqual(1);

      const lowBadges = screen.getAllByText("Low");
      expect(lowBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("SignalBadge", () => {
    it("renders correct level tags", () => {
      const { rerender } = render(<SignalBadge level="Info" />);
      expect(screen.getByText("Info")).toHaveClass("tag");

      rerender(<SignalBadge level="Watch" />);
      expect(screen.getByText("Watch")).toHaveClass("tag");

      rerender(<SignalBadge level="Concern" />);
      expect(screen.getByText("Concern")).toHaveClass("tag");
    });
  });
});
