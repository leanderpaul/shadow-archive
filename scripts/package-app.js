/**
 * Importing npm packages.
 */
const { writeFileSync, rmSync, readFileSync } = require('fs');
const { execSync } = require('child_process');

/**
 * Declaring the constants.
 */

function copyPackageJson() {
  /** Removing unneccessary scripts from package.json and copying */
  const packageJson = JSON.parse(readFileSync(`package.json`).toString());
  const distPackageJson = { ...packageJson, scripts: { postinstall: 'patch-package' } };
  writeFileSync(`dist/package.json`, JSON.stringify(distPackageJson, null, 2));
}

function packageApp() {
  /** Building the package */
  try {
    execSync('nest build');
  } catch (err) {
    console.log(err.stdout.toString());
  }

  /** Copying the required files */
  copyPackageJson();
  execSync(`cp package-lock.json dist/package-lock.json`);
  execSync(`cp -r patches dist/patches`);

  /** Deleting the unneccesary files */
  rmSync(`dist/tsconfig.build.tsbuildinfo`);
}

packageApp();
