import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("Application End-to-End Workflow & Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders IntroView by default with title and start button", () => {
    render(<App />);
    expect(screen.getByText("What this tool does")).toBeInTheDocument();
    expect(screen.getByText("What it is not")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start diagnostic" })).toBeInTheDocument();
  });

  it("progresses from Intro to Diagnostic view when clicking Start", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));

    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Domain scores (0–4)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My team / organisation")).toBeInTheDocument();
  });

  it("navigates back to IntroView when clicking Back in DiagnosticView", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));
    expect(screen.getByText("Context")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("What this tool does")).toBeInTheDocument();
  });

  it("allows filling in context, scores, signals, and progresses to ResultsView", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));

    // Fill in org name
    const orgInput = screen.getByDisplayValue("My team / organisation");
    await user.clear(orgInput);
    await user.type(orgInput, "Faculty of Medicine");

    // Select high-stakes checkbox
    const highStakesCheckbox = screen.getByLabelText(/High-stakes use/i);
    await user.click(highStakesCheckbox);
    expect(highStakesCheckbox).toBeChecked();

    // Toggle notes and add notes
    await user.click(screen.getByRole("button", { name: "Show notes" }));
    const capabilityTextarea = screen.getByPlaceholderText(/What capability does this support/i);
    await user.type(capabilityTextarea, "Clinical decision aids");

    // Click Generate diagnostic
    await user.click(screen.getByRole("button", { name: "Generate diagnostic" }));

    // Verify ResultsView rendered
    expect(screen.getByText("Diagnostic Summary")).toBeInTheDocument();
    expect(screen.getByText("Faculty of Medicine")).toBeInTheDocument();
    expect(screen.getByText("Top 3 Priority Risks")).toBeInTheDocument();
    expect(screen.getByText("Ranked Capability Gaps")).toBeInTheDocument();
    expect(screen.getByText("Full Risk Signals & Discussion Prompts")).toBeInTheDocument();
    expect(screen.getByText("Capability & Governance Notes")).toBeInTheDocument();
    expect(screen.getByText("Clinical decision aids")).toBeInTheDocument();
  });

  it("preserves user inputs when clicking Back from ResultsView to DiagnosticView", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start diagnostic
    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));

    // Change org name
    const orgInput = screen.getByDisplayValue("My team / organisation");
    await user.clear(orgInput);
    await user.type(orgInput, "Institute of AI");

    // Submit
    await user.click(screen.getByRole("button", { name: "Generate diagnostic" }));
    expect(screen.getByText("Institute of AI")).toBeInTheDocument();

    // Click Back from results
    await user.click(screen.getByRole("button", { name: "Back" }));

    // Check that we are back in DiagnosticView and "Institute of AI" is preserved
    expect(screen.getByDisplayValue("Institute of AI")).toBeInTheDocument();
  });

  it("resets state when clicking Restart in header", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));

    const orgInput = screen.getByDisplayValue("My team / organisation");
    await user.clear(orgInput);
    await user.type(orgInput, "Ephemeral Lab");

    await user.click(screen.getByRole("button", { name: "Generate diagnostic" }));
    expect(screen.getByText("Ephemeral Lab")).toBeInTheDocument();

    // Click Restart in header
    await user.click(screen.getByRole("button", { name: "Restart" }));

    // Returned to intro
    expect(screen.getByText("What this tool does")).toBeInTheDocument();

    // If starting again, default org name is shown
    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));
    expect(screen.getByDisplayValue("My team / organisation")).toBeInTheDocument();
  });

  it("handles copy to clipboard interaction on ResultsView", async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));
    await user.click(screen.getByRole("button", { name: "Generate diagnostic" }));

    const copyBtn = screen.getByRole("button", { name: "Copy summary for discussion" });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Copied ✓")).toBeInTheDocument();
    });
  });

  it("toggles 'Why this matters' expandable panel on ResultsView", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));
    await user.click(screen.getByRole("button", { name: "Generate diagnostic" }));

    const whyButtons = screen.getAllByRole("button", { name: /why this matters/i });
    expect(whyButtons.length).toBeGreaterThan(0);

    const firstBtn = whyButtons[0];
    const initialText = firstBtn.textContent;

    await user.click(firstBtn);
    expect(firstBtn.textContent).not.toBe(initialText);
  });

  it("supports programme coverage checkbox toggle and inputs", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start diagnostic" }));

    const coverageToggle = screen.getByLabelText(/Include rough coverage estimates/i);
    expect(screen.queryByText("Approximate proportion of attention/learning/practice in this domain.")).toBeNull();

    await user.click(coverageToggle);
    expect(screen.getAllByText("Approximate proportion of attention/learning/practice in this domain.").length).toBe(6);

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "85" } });
    expect(inputs[0]).toHaveValue(85);
  });
});
