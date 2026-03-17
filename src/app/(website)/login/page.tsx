import { redirect } from 'next/navigation'

// Login is now unified at /account via OTP.
export default function LoginPage() {
  redirect('/account')
}
