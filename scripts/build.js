const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Create temporary tsconfig for CJS
const tsconfigCJS = {
  extends: './tsconfig.json',
  compilerOptions: {
    module: 'CommonJS',
    moduleResolution: 'Node',
    outDir: 'dist',
    rootDir: 'src'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', 'test']
};
fs.writeFileSync('tsconfig.cjs.json', JSON.stringify(tsconfigCJS, null, 2));

// Create temporary tsconfig for ESM
const tsconfigESM = {
  extends: './tsconfig.json',
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    outDir: 'dist',
    rootDir: 'src'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', 'test']
};
fs.writeFileSync('tsconfig.esm.json', JSON.stringify(tsconfigESM, null, 2));

try {
  // Build CommonJS
  console.log('Building CommonJS...');
  execSync('tsc -p tsconfig.cjs.json', { stdio: 'inherit' });

  // Build ESM and rename to .mjs
  console.log('Building ESM...');
  execSync('tsc -p tsconfig.esm.json', { stdio: 'inherit' });

  // Rename ESM files to .mjs
  const files = fs.readdirSync('dist');
  files.forEach(file => {
    if (file.endsWith('.js')) {
      // Skip files that are already processed by CJS build
      const mjsPath = path.join('dist', file.replace(/\.js$/, '.mjs'));
      const jsPath = path.join('dist', file);
      if (!fs.existsSync(mjsPath)) {
        fs.renameSync(jsPath, mjsPath);
      }
    }
  });

  console.log('Build completed successfully!');
} finally {
  // Cleanup temporary config files
  fs.unlinkSync('tsconfig.cjs.json');
  fs.unlinkSync('tsconfig.esm.json');
}