const esbuild = require('esbuild');
const fs = require('fs');

start();

async function start() {
  try {
    await buildCli();
    copyAssets();
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function buildCli() {
  try {
    await esbuild.build({
      entryPoints: ['./src/scan-cli/index.ts'],
      bundle: true,
      outfile: './dist/scan-cli/index.js',
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      banner: {
        js: '#!/usr/bin/env node',  // Add shebang for CLI
      },
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
      mainFields: ['module', 'main'], // Prioritize ESM versions
      external: [
        // Add any packages that should remain external
        'fsevents',
        // Add other problematic native modules if needed
      ],
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
      }
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

function copyAssets(){
  // Copy templates to dist folder
  fs.cpSync('./src/scan-lib/templates', './dist/scan-cli/templates', { recursive: true });
  fs.copyFileSync('./src/scan-cli/package.json', './dist/scan-cli/package.json');
  console.log('Assets copied to scan cli folder');
}
