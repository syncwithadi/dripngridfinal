import { redirect } from 'next/navigation'

// Signup is now unified with the account page via OTP.
// No separate signup flow needed — the account page auto-creates users.
export default function SignupPage() {
  redirect('/account')
}
