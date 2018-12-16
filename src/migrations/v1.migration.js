const VERSION = 1

const migrate = configuration => {
  const migratedConfiguration = Object.assign({}, configuration)
  migratedConfiguration.version = VERSION

  return migratedConfiguration
}

module.exports = migrate
