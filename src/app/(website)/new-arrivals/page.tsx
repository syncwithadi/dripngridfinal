import { redirect } from 'next/navigation';

// New Arrivals redirects to the shop filtered by new arrivals
export default function NewArrivalsPage() {
  redirect('/shop?sort=newest');
}
