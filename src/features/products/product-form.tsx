import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type ProductDetail, updateProductMutation } from '@/features/products/queries'
import { getErrorMessage } from '@/lib/api'

const productFormSchema = z.object({
  title: z.string().check(z.trim(), z.minLength(1, 'Enter a title')),
  // The input gives a string; number<number> keeps the form's type a number
  price: z.coerce.number<number>().check(z.positive('Enter a price above 0')),
  description: z.string().check(z.trim()),
})

export function ProductForm({ product, onSaved }: { product: ProductDetail; onSaved: () => void }) {
  const mutation = useMutation(updateProductMutation(useQueryClient(), product.id))
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: standardSchemaResolver(productFormSchema),
    defaultValues: product,
  })

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: onSaved }))}
    >
      <FieldGroup>
        <FormField control={form.control} name='title' label='Title'>
          {(field) => <Input {...field} />}
        </FormField>
        <FormField control={form.control} name='price' label='Price'>
          {(field) => <Input {...field} type='number' step='0.01' />}
        </FormField>
        <FormField control={form.control} name='description' label='Description'>
          {(field) => <Textarea {...field} />}
        </FormField>
        {mutation.isError && <FieldError>{getErrorMessage(mutation.error)}</FieldError>}
        <Button type='submit' disabled={mutation.isPending}>
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}
