import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to summary page as the default
  redirect('/summary')
}