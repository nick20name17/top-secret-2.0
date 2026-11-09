import { Button } from '@/components/ui/button'
import { clearSession } from '@/lib/session'

export function SignOutButton() {
  // The _authed layout hears the change and sends the user to sign in
  return (
    <Button variant='outline' onClick={clearSession}>
      Sign out
    </Button>
  )
}
