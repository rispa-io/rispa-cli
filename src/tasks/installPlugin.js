const path = require('path')
const { addSubtree, cloneRepository } = require('../utils/git')

const createInstallPlugin = (name, cloneUrl) => ({
  title: `Install plugin with name '${name}'`,
  task: ({ pluginsPath, projectPath, mode }) => {
    if (mode === 'dev') {
      cloneRepository(pluginsPath, cloneUrl)
    } else {
      const pluginsRelPath = path.relative(projectPath, pluginsPath)
      const prefix = `${pluginsRelPath}/${name}`
      addSubtree(projectPath, prefix, name, cloneUrl)
    }
  },
})

module.exports = createInstallPlugin
