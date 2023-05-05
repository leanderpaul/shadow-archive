/**
 * Importing npm packages.
 */
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Declaring the constants.
 */
const rootDir = `${__dirname}/..`;
const distDir = `${rootDir}/dist`;

function copyTask() {
  /** Removing unneccessary scripts from package.json and copying */
  const packageJson = require('../package.json');
  const distPackageJson = { ...packageJson, scripts: { start: 'node main.js', postinstall: 'patch-package' } };
  fs.writeFileSync(`${distDir}/package.json`, JSON.stringify(distPackageJson, null, 2));

  execSync(`cp ${rootDir}/package-lock.json ${distDir}/package-lock.json`);
  execSync(`cp -r ${rootDir}/patches ${distDir}/patches`);
}

function packageApp() {
  execSync('npm run build', { cwd: rootDir });
  copyTask();
  execSync(`zip -r ${rootDir}/shadow-archive.zip .`, { cwd: distDir });
}

packageApp();
