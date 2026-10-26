import { describe, expect, it } from "vitest";
import { contactSchema } from "@/components/site/ContactForm";

const base = { type: "demo", name: "Ali Veli", email: "ali@ornek.com", phone: "0312 255 55 86", interest: "S3000i", message: "Santralim için demo istiyorum.", consent: true } as const;

describe("contact form", () => {
  it("accepts a valid request", () => expect(contactSchema.safeParse(base).success).toBe(true));
  it("requires KVKK consent", () => expect(contactSchema.safeParse({ ...base, consent: false }).success).toBe(false));
  it("rejects invalid email", () => expect(contactSchema.safeParse({ ...base, email: "x" }).success).toBe(false));
});
