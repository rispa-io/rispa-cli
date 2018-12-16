const Listr = require('listr')
const { CONFIGURATION_VERSION } = require('../constants')

const createMigrationTask = (migrationName, migrationPath) => ({
  title: migrationName,
  task: ctx => {
    ctx.configuration = require(migrationPath)(ctx.configuration)
  },
})

const migrateProjectConfiguration = {
  title: 'Migrate project configuration',
  skip: ({ configuration }) => {
    if (configuration.version !== undefined && CONFIGURATION_VERSION <= configuration.version) {
      return 'Config already in actual version'
    }

    return false
  },
  task: ctx => {
    const migrationTasks = []
    const currentVersion = ctx.configuration.version || 0
    for (let i = currentVersion; i < CONFIGURATION_VERSION; ++i) { // eslint-disable-line no-plusplus
      migrationTasks.push(createMigrationTask(`v${i}.migration`, require.resolve(`../migrations/v${i}.migration`)))
    }

    return new Listr(migrationTasks, { exitOnError: false })
  }
}

module.exports = migrateProjectConfiguration
