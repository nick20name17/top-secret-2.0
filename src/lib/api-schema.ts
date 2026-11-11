import type { z } from 'zod/mini'

import type { components } from '@/lib/api.gen'

type ApiSchemas = components['schemas']

// Every field the zod schema reads must exist in the API schema with the same type
type ReadFrom<Api, Output> = {
  [Key in keyof Output]: Key extends keyof Api ? NonNullable<Api[Key]> : never
}

/**
 * Ties a zod schema to a schema of the API's OpenAPI document (`bun run api:types`).
 * A field the API lacks, or types differently, is a compile error.
 */
export function apiSchema<Name extends keyof ApiSchemas, Schema extends z.ZodMiniType>(
  _name: Name,
  schema: Schema & z.ZodMiniType<ReadFrom<ApiSchemas[Name], z.infer<Schema>>>,
): Schema {
  return schema
}
