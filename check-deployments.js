#!/usr/bin/env node

/**
 * Automated Deployment Verification Script
 * Checks Vercel (frontend) and Render (backend) deployments
 */

const https = require('https');
const http = require('http');

// Common deployment URL patterns based on repo name
const possibleUrls = {
  vercel: [
    'https://night-driver.vercel.app',
    'https://nightdriver.vercel.app',
    'https://night-driver-dante.vercel.app',
    'https://night-driver-dantearceaneaux.vercel.app'
  ],
  render: [
    'https://night-driver-api.onrender.com',
    'https://nightdriver-api.onrender.com',
    'https://seattle-driver-optimizer.onrender.com'
  ]
};

function checkUrl(url, type) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const healthPath = type === 'backend' ? '/api/health' : '/';
    const fullUrl = url + healthPath;
    
    console.log(`\n🔍 Checking ${type}: ${fullUrl}`);
    
    const req = client.get(fullUrl, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${url} - ONLINE (${res.statusCode})`);
          resolve({ url, online: true, status: res.statusCode, type });
        } else {
          console.log(`⚠️  ${url} - Status ${res.statusCode}`);
          resolve({ url, online: false, status: res.statusCode, type });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - OFFLINE (${err.code})`);
      resolve({ url, online: false, error: err.code, type });
    });
    
    req.on('timeout', () => {
      console.log(`⏱️  ${url} - TIMEOUT`);
      req.destroy();
      resolve({ url, online: false, error: 'TIMEOUT', type });
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Night Driver - Deployment Verification');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📦 Repository: DanteArceneaux/NightDriver');
  console.log('🔄 Last Push: Just now (main branch)\n');
  
  const allChecks = [];
  
  // Check Vercel (Frontend)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 VERCEL (Frontend)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const url of possibleUrls.vercel) {
    const result = await checkUrl(url, 'frontend');
    allChecks.push(result);
  }
  
  // Check Render (Backend)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  RENDER (Backend)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const url of possibleUrls.render) {
    const result = await checkUrl(url, 'backend');
    allChecks.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const onlineServices = allChecks.filter(c => c.online);
  const vercelOnline = onlineServices.filter(c => c.type === 'frontend');
  const renderOnline = onlineServices.filter(c => c.type === 'backend');
  
  if (vercelOnline.length > 0) {
    console.log('✅ VERCEL: DEPLOYED');
    vercelOnline.forEach(s => console.log(`   └─ ${s.url}`));
  } else {
    console.log('❌ VERCEL: NOT FOUND or NOT DEPLOYED YET');
    console.log('   ℹ️  Note: First-time deployments can take 2-5 minutes');
    console.log('   ℹ️  Check: https://vercel.com/dashboard');
  }
  
  console.log('');
  
  if (renderOnline.length > 0) {
    console.log('✅ RENDER: DEPLOYED');
    renderOnline.forEach(s => console.log(`   └─ ${s.url}`));
  } else {
    console.log('❌ RENDER: NOT FOUND or NOT DEPLOYED YET');
    console.log('   ℹ️  Note: Render deployments can take 5-10 minutes');
    console.log('   ℹ️  Check: https://dashboard.render.com');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (onlineServices.length === 0) {
    console.log('1. Wait 2-5 minutes for deployments to complete');
    console.log('2. Re-run this script: node check-deployments.js');
    console.log('3. Check deployment status:');
    console.log('   - Vercel: https://vercel.com/dashboard');
    console.log('   - Render: https://dashboard.render.com');
    console.log('\n⏳ If this is your first deployment, platforms need to be');
    console.log('   connected to GitHub first. See DEPLOYMENT_CHECKLIST.md\n');
  } else {
    console.log('✨ Active deployments found!');
    console.log('📱 Test the app in your browser at the URLs above');
    console.log('🔄 Auto-deploy is active - future git pushes will update automatically\n');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);

