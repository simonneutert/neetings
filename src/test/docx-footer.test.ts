import { describe, expect, it } from "vitest";
// jszip ships with docx, which uses it to build the archive
import JSZip from "jszip";
import { DOCXTransformer } from "../utils/export/transformers/DOCXTransformer.ts";
import { TestDataFactory } from "./factories/testDataFactory.ts";

describe("DOCX footer", () => {
  it("renders the footer text with a PAGE number field", async () => {
    const meeting = TestDataFactory.createMeeting({ title: "Footer Meeting" });

    const result = await new DOCXTransformer().transform({
      meeting,
      options: { format: "docx", filename: "test.docx" },
    });

    const zip = await JSZip.loadAsync(result.content, { base64: true });
    const footerFile = Object.keys(zip.files).find((name) =>
      /^word\/footer\d*\.xml$/.test(name)
    );
    const footer = await zip.file(footerFile!)!.async("string");

    expect(footer).toContain(" - Page </w:t>");
    expect(footer).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);
    // PageNumber.CURRENT as a bare paragraph child used to emit <w:p>CURRENT</w:p>
    expect(footer).not.toContain("CURRENT");
  });
});
