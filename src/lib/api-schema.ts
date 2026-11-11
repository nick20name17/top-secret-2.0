import type { z } from 'zod/mini'

import type { components } from '@/lib/api.gen'

type ApiSchemas = components['schemas']

type ReadFrom<Api, Output> = {
  [Key in keyof Output]: Key extends keyof Api ? NonNullable<Api[Key]> : never
}

// A field the API schema lacks, or types differently, fails to compile
export function apiSchema<Name extends keyof ApiSchemas, Schema extends z.ZodMiniType>(
  _name: Name,
  schema: Schema & z.ZodMiniType<ReadFrom<ApiSchemas[Name], z.infer<Schema>>>,
): Schema {
  return schema
}
