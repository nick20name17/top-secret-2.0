import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { loginMutation } from '@/features/auth/queries'
import { getErrorMessage } from '@/lib/api'

const loginSchema = z.object({
  username: z.string().check(z.trim(), z.minLength(1, 'Enter your username')),
  password: z.string().check(z.minLength(1, 'Enter your password')),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const mutation = useMutation(loginMutation(useQueryClient()))
  const form = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: onSignedIn }))}
    >
      <FieldGroup>
        <Controller
          name='username'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Username</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete='username'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='password'
                autoComplete='current-password'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {mutation.isError && <FieldError>{getErrorMessage(mutation.error)}</FieldError>}
        <Button type='submit' disabled={mutation.isPending}>
          Sign in
        </Button>
      </FieldGroup>
    </form>
  )
}
