import type { JsonObject } from "@chronarium/types";

export interface SchemaDefinition<TName extends string = string> {
  readonly id: TName;
  readonly version: 1;
  readonly title: string;
  readonly description: string;
  readonly kind: "json-schema-lite";
  readonly schema: JsonObject;
}

export function defineSchema<TSchema extends SchemaDefinition>(
  schema: TSchema
): TSchema {
  return schema;
}
