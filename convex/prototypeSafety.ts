import { ConvexError } from "convex/values";

export function assertPrototypeWriteEnabled(): void {
  throw new ConvexError({
    code: "PROTOTYPE_READ_ONLY",
    message:
      "Prototype write and paid-provider operations are disabled until authentication, tenancy, and approval controls are implemented.",
  });
}
