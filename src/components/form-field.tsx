import type { ReactNode } from 'react'
import {
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  useController,
} from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'

export function FormField<Values extends FieldValues, Name extends FieldPath<Values>>({
  control,
  name,
  label,
  children,
}: {
  control: Control<Values>
  name: Name
  label: string
  children: (
    field: ControllerRenderProps<Values, Name> & { id: Name; 'aria-invalid': boolean },
  ) => ReactNode
}) {
  const { field, fieldState } = useController({ control, name })

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {children({ ...field, id: name, 'aria-invalid': fieldState.invalid })}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )
}
