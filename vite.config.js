import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const plugins = [react()];

  // Generate the bundle report only on demand: ANALYZE=true npm run build.
  if (process.env.ANALYZE === 'true') {
    plugins.push(visualizer({
      emitFile: true,
      filename: 'stats.html',
    }));
  }

  return {
    base: './',
    build: {
      outDir: 'dist',
    },
    plugins,
    optimizeDeps: {
      include: ['@mui/material', '@emotion/styled'],
    },
  };
});
