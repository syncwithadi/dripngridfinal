'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemas';
import { ViewUserDetailsAction } from './src/sanity/actions/ViewUserDetailsAction';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'm4jaxdfe';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'dripngrid-studio',
  title: 'DRIPNGRID Studio',

  projectId,
  dataset,
  basePath: '/studio',

  plugins: [
    structureTool(),
    visionTool({
      defaultApiVersion: '2024-01-01',
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      // Add ViewUserDetailsAction only for user documents
      if (context.schemaType === 'user') {
        return [ViewUserDetailsAction, ...prev];
      }
      return prev;
    },
  },
});
