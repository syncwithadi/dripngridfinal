// Export all schemas
import { productSchema } from './product';
import { categorySchema } from './category';
import { orderSchema } from './order';
import { orderCounterSchema } from './orderCounter';
import { siteSettingsSchema } from './siteSettings';
import { lookbookSchema } from './lookbook';
import { testimonialSchema } from './testimonial';
import philosophySectionSchema from './philosophySection';
import newsletterSubscriberSchema from './newsletter';
import user from './user';
import account from './account';
import verificationToken from './verificationToken';
import otp from './otp';
import { blogSchema } from './blog';
import { couponSchema } from './coupon';

export const schemaTypes = [
  productSchema,
  categorySchema,
  blogSchema,
  orderSchema,
  orderCounterSchema,
  couponSchema,
  siteSettingsSchema,
  lookbookSchema,
  testimonialSchema,
  philosophySectionSchema,
  newsletterSubscriberSchema,
  user,
  account,
  verificationToken,
  otp,
];
