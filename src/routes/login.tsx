import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { LoginForm } from '@/features/auth/login-form'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Sign in' }] }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className='flex min-h-svh items-center justify-center p-6'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <h1 className='text-lg font-medium'>Sign in</h1>
        {/* No auth yet: a real app sends the values to the API first */}
        <LoginForm onSubmit={() => void navigate({ to: '/' })} />
      </div>
    </div>
  )
}
