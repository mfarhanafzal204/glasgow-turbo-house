#!/usr/bin/env node

console.log('🔧 Glasgow Turbo Store - Troubleshooting Script');
console.log('================================================\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js Version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 18) {
  console.log('❌ Node.js version should be 18 or higher');
} else {
  console.log('✅ Node.js version is compatible');
}

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  '.env.local',
  'next.config.js',
  'tailwind.config.js',
  'app/page.tsx',
  'lib/firebase.ts'
];

console.log('\n📁 Checking Required Files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Check environment variables
console.log('\n🔐 Checking Environment Variables:');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar) && !envContent.includes('your_')) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - Not configured properly`);
    }
  });
} catch (error) {
  console.log('❌ .env.local file not found or not readable');
}

// Check node_modules
console.log('\n📦 Checking Dependencies:');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules folder exists');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['next', 'react', 'firebase', 'tailwindcss'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - Missing dependency`);
    }
  });
} else {
  console.log('❌ node_modules folder not found - Run: npm install');
}

console.log('\n🚀 Quick Fixes:');
console.log('1. Missing dependencies: npm install');
console.log('2. Environment issues: Check .env.local file');
console.log('3. Firebase errors: Verify Firebase project setup');
console.log('4. Build errors: Delete .next folder and restart');
console.log('5. Port issues: Try different port: npm run dev -- -p 3001');

console.log('\n📖 For detailed setup instructions, see:');
console.log('- FINAL_SETUP_INSTRUCTIONS.md');
console.log('- SETUP_GUIDE.md');

console.log('\n🎯 Your store should be running at: http://localhost:3000');
console.log('🔧 Admin panel: http://localhost:3000/admin');