import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LandingPage from "@/app/page";

describe("LandingPage", () => {
  it("renders headline", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", { name: /svadba plus/i })
    ).toBeInTheDocument();
  });
});
