import { describe, expect, it } from "vitest";
import { validateMeetingIntegrity } from "../schemas/meeting.ts";

// Guards the Zod 4 error API (`error.issues`; Zod 3's `error.errors` is gone)
describe("Zod validation error details", () => {
  it("returns readable errors for an invalid meeting instead of throwing", () => {
    const result = validateMeetingIntegrity({ id: 1 });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/^\w+: /);
  });
});
