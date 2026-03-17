import { redirect } from 'next/navigation';

// Bestsellers redirects to shop filtered by bestseller badge
export default function BestsellersPage() {
  redirect('/shop?sort=bestsellers');
}
