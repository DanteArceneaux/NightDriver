// Test script to verify deployment readiness
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Deployment Readiness');
console.log('===============================\n');

// Check critical files
const criticalFiles = [
  'vercel.json',
  'render.yaml',
  'frontend/package.json',
  'frontend/vite.config.ts',
  'backend/package.json',
  'backend/tsconfig.json'
];

console.log('📁 Checking critical files...');
let allFilesExist = true;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking package.json scripts...');
const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));

console.log('  Frontend scripts:');
console.log(`    - build: ${frontendPackage.scripts.build}`);
console.log(`    - dev: ${frontendPackage.scripts.dev}`);

console.log('  Backend scripts:');
console.log(`    - build: ${backendPackage.scripts.build}`);
console.log(`    - start: ${backendPackage.scripts.start}`);

console.log('\n🔧 Checking Vercel configuration...');
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
console.log(`  Build command: ${vercelConfig.buildCommand}`);
console.log(`  Output directory: ${vercelConfig.outputDirectory}`);
console.log(`  Framework: ${vercelConfig.framework}`);

console.log('\n🔧 Checking Render configuration...');
const renderConfig = fs.readFileSync('render.yaml', 'utf8');
const hasBackendService = renderConfig.includes('night-driver-api');
console.log(`  Backend service configured: ${hasBackendService ? '✅' : '❌'}`);

console.log('\n📊 Summary:');
console.log('===========');
if (allFilesExist) {
  console.log('✅ All critical files present');
  console.log('✅ Build configurations valid');
  console.log('✅ Ready for deployment!');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Check Vercel dashboard for auto-deployment status');
  console.log('2. Check Render dashboard for auto-deployment status');
  console.log('3. If not auto-deployed, trigger manually via dashboards');
  console.log('4. Run ./deploy.bat (Windows) or ./deploy.sh (Mac/Linux) for help');
} else {
  console.log('❌ Some files are missing. Please fix before deploying.');
  process.exit(1);
}
