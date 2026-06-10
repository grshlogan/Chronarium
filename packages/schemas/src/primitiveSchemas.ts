import { z } from "zod";

export const redactionStatusSchema = z.enum([
  "safe",
  "synthetic",
  "redacted",
  "contains-sensitive",
  "unknown"
]);

export const isoDateTimeStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Expected an ISO-compatible date-time string."
);

export const relativeArchivePathSchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes("\\"), {
    message: "Archive paths must use forward slashes."
  })
  .refine((value) => !value.startsWith("/") && !/^[A-Za-z]:/.test(value), {
    message: "Archive paths must be relative."
  })
  .refine((value) => !value.split("/").includes(".."), {
    message: "Archive paths must not escape the archive root."
  });

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);
