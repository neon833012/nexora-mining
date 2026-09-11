const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Step 1: Installing frontend dependencies ---');
execSync('npm --prefix frontend install', { stdio: 'inherit' });

console.log('--- Step 2: Building frontend ---');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

console.log('--- Step 3: Copying frontend/dist to root dist ---');
const srcDir = path.join(__dirname, 'frontend', 'dist');
const destDir = path.join(__dirname, 'dist');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.cpSync(srcDir, destDir, { recursive: true, force: true });
console.log('=== BUILD SUCCESSFUL: Output in dist/ ===');
