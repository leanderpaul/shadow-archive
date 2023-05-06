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

function copyPackageJson() {
  /** Removing unneccessary scripts from package.json and copying */
  const packageJson = require('../package.json');
  const distPackageJson = { ...packageJson, scripts: { postinstall: 'patch-package' } };
  fs.writeFileSync(`${distDir}/package.json`, JSON.stringify(distPackageJson, null, 2));
}

function packageApp() {
  /** Building the package */
  execSync('nest build', { cwd: rootDir });

  /** Copying the required files */
  copyPackageJson();
  execSync(`cp ${rootDir}/package-lock.json ${distDir}/package-lock.json`);
  execSync(`cp -r ${rootDir}/patches ${distDir}/patches`);

  /** Deleting the unneccesary files */
  fs.rmSync(`${distDir}/tsconfig.build.tsbuildinfo`);
}

packageApp();
