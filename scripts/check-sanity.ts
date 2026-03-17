import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const token = process.env.SANITY_API_TOKEN;
console.log('Token length:', token?.length);
console.log('Token first 5 chars:', token?.substring(0, 5));

const client = createClient({
  projectId: 'm4jaxdfe',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function check() {
  try {
    console.log('Checking connection...');
    // Fetch one product with all fields
    const product = await client.fetch(`*[_type == "product"][0]`);
    console.log('Product Name:', product?.name);
    console.log('Product Images Raw:', JSON.stringify(product?.images, null, 2));
    
    if (product?.images?.front?.asset?._ref) {
      console.log('Front Image Asset Ref:', product.images.front.asset._ref);
    } else {
      console.log('WARNING: Front image asset reference is missing!');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.response) {
        console.error('Status:', err.response.statusCode);
        console.error('Body:', err.response.body);
    }
  }
}

check();
