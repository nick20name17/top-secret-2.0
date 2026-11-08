import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useRef } from 'react'
import { z } from 'zod/mini'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().check(z.minLength(8, 'Password must be at least 8 characters')),
})

export type LoginValues = z.infer<typeof loginSchema>

function focusFirstInvalid(form: HTMLFormElement | null, invalidNames: Set<string>) {
  const invalid = [...(form?.elements ?? [])].find((element) =>
    invalidNames.has(element.getAttribute('name') ?? ''),
  )
  if (invalid instanceof HTMLElement) invalid.focus()
}

export function LoginForm({ onSubmit }: { onSubmit: (values: LoginValues) => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm({
    defaultValues: { email: '', password: '' },
    // Errors appear on the first submit, then update as the user types
    validationLogic: revalidateLogic(),
    validators: { onDynamic: loginSchema },
    onSubmit: ({ value }) => {
      onSubmit(value)
    },
    onSubmitInvalid: ({ formApi }) => {
      const invalidNames = Object.entries(formApi.state.fieldMeta)
        .filter(([, meta]) => !meta.isValid)
        .map(([name]) => name)
      focusFirstInvalid(formRef.current, new Set(invalidNames))
    },
  })

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name='email'>
          {(field) => {
            const isInvalid = !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type='email'
                  autoComplete='email'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
        <form.Field name='password'>
          {(field) => {
            const isInvalid = !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type='password'
                  autoComplete='current-password'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
        <Button type='submit'>Sign in</Button>
      </FieldGroup>
    </form>
  )
}
