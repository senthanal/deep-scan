const esbuild = require('esbuild');
const fs = require('fs');

start();

async function start() {
  try {
    await build();
    copyAssets();
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['./index.ts'],
      bundle: true,
      outfile: './../../dist/@senthanal/scan-cli/index.js',
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
  fs.cpSync('./../scan-lib/templates', './../../dist/@senthanal/scan-cli/templates', { recursive: true });
  fs.copyFileSync('./package.json', './../../dist/@senthanal/scan-cli/package.json');
  console.log('Assets copied to scan cli folder');
}
