import { createImageUrlBuilder } from '@sanity/image-url';
import dotenv from 'dotenv';

// Mock config because we are running in script
const sanityConfig = {
  projectId: 'm4jaxdfe',
  dataset: 'production',
};

const builder = createImageUrlBuilder(sanityConfig);

function urlFor(source: any) {
  return builder.image(source);
}

const imageRef = 'image-d74c927056c14cb1d72f20b28ce3d25560b58580-800x533-jpg';
const source = {
  asset: {
    _ref: imageRef
  }
};

try {
  const url = urlFor(source).width(800).url();
  console.log('Generated URL:', url);
} catch (error) {
  console.error('Error generating URL:', error);
}
