#!/usr/bin/env node

const { dirname, basename, join } = require('path');

// Get package name to use as namespace.
// Allows blueprints to be aliased.
const packagePath = dirname(dirname(__dirname));
console.log(packagePath);
const { version } = require(`${packagePath}/package.json`);
const packageFolderName = basename(packagePath);
const devBlueprintPath = join(packagePath, '.blueprint');
const blueprint = packageFolderName.startsWith('jhipster-') ? `generator-${packageFolderName}` : packageFolderName;

(async () => {
  const { runJHipster, done, logger } = await import('generator-jhipster/cli');

  runJHipster({
    executableName: 'jhipster-dev',
    executableVersion: version,
    defaultCommand: 'generate-sample',
    devBlueprintPath,
    blueprints: {
      [blueprint]: version,
    },
    printBlueprintLogo: () => {
      console.log('===================== JHipster es-reindexer generate-sample =====================');
      console.log('');
    },
    lookups: [{ packagePaths: [packagePath] }],
  }).catch(done);

  process.on('unhandledRejection', up => {
    logger.error('Unhandled promise rejection at:');
    logger.fatal(up);
  });
})();
