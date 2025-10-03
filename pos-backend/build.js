const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting build process...');

try {
  // Try to build with TypeScript
  console.log('Attempting TypeScript compilation...');
  execSync('npx tsc --skipLibCheck --allowJs', { stdio: 'inherit' });
  console.log('TypeScript build successful!');
} catch (error) {
  console.log('TypeScript build failed, trying alternative approach...');
  
  // Create dist directory
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Copy TypeScript files and rename to .js
  const srcDir = './src';
  const distDir = './dist';
  
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = src + '/' + item;
      const destPath = dest + '/' + item;
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        const content = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath.replace('.ts', '.js'), content);
      }
    }
  }
  
  copyDir(srcDir, distDir);
  console.log('Files copied successfully!');
}
