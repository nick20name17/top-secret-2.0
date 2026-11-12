import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
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
        <FormField control={form.control} name='username' label='Username'>
          {(field) => <Input {...field} autoComplete='username' />}
        </FormField>
        <FormField control={form.control} name='password' label='Password'>
          {(field) => <Input {...field} type='password' autoComplete='current-password' />}
        </FormField>
        {mutation.isError && <FieldError>{getErrorMessage(mutation.error)}</FieldError>}
        <Button type='submit' disabled={mutation.isPending}>
          Sign in
        </Button>
      </FieldGroup>
    </form>
  )
}
