import * as SanityImage from '@sanity/image-url';
import * as NextSanityImage from 'next-sanity/image';

console.log('@sanity/image-url exports:', Object.keys(SanityImage));
console.log('default:', typeof SanityImage.default);

console.log('next-sanity/image exports:', Object.keys(NextSanityImage));
