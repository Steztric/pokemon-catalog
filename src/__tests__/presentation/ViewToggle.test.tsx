import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewToggle } from "../../presentation/components/ViewToggle";

describe("ViewToggle", () => {
  it("renders Grid and List buttons", () => {
    render(<ViewToggle value="grid" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /grid view/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list view/i })).toBeInTheDocument();
  });

  it("marks the active view as pressed", () => {
    render(<ViewToggle value="list" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /list view/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /grid view/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with 'list' when List is clicked", () => {
    const onChange = vi.fn();
    render(<ViewToggle value="grid" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /list view/i }));
    expect(onChange).toHaveBeenCalledWith("list");
  });

  it("calls onChange with 'grid' when Grid is clicked", () => {
    const onChange = vi.fn();
    render(<ViewToggle value="list" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /grid view/i }));
    expect(onChange).toHaveBeenCalledWith("grid");
  });
});
