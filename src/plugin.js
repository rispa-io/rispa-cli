const { cloneRepository } = require('./git')

const installPlugins = (plugins, pluginsPath, mode) => (
  plugins.forEach(({ name, clone_url: cloneUrl }) => {
    console.log(`Install plugin with name: ${name}`)

    if (mode === 'dev') {
      cloneRepository(cloneUrl, pluginsPath) // TODO use subtree
    } else {
      cloneRepository(cloneUrl, pluginsPath)
    }
  })
)

module.exports = {
  installPlugins,
}
