import { Button } from '@/components/ui/button'
import { clearSession } from '@/lib/session'

export function SignOutButton() {
  return (
    <Button variant='outline' onClick={clearSession}>
      Sign out
    </Button>
  )
}
