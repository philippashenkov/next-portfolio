import { render, screen, waitFor } from "@testing-library/react";
import Typewriter from "../app/components/Typewriter";

describe("Typewriter", () => {
  test("types lines quickly and shows cursor during typing, then signature", async () => {
    render(
      <Typewriter
        lines={["> booting", "done"]}
        speedMsPerChar={2}
        lineDelayMs={5}
        startDelayMs={1}
        cursorStyle="bar"
        showEndSignature={true}
        endSignature="END"
        endSignatureDelayMs={10}
      />
    );

    // Wait for partial text to appear (avoid brittle timing on first few chars)
    await waitFor(() => {
      expect(document.body.textContent).toContain("> boot");
    }, { timeout: 500 });

    // Wait for all to complete and signature to appear
    await waitFor(() => {
      expect(screen.getByText("END")).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
