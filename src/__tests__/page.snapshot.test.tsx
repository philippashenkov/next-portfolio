import { render } from "@testing-library/react";
import React from "react";
import Home from "../app/page";

// Snapshot test for the page structure (client-rendered)

describe("Home page", () => {
  it("matches snapshot", () => {
    const { asFragment } = render(<Home />);
    expect(asFragment()).toMatchSnapshot();
  });
});
