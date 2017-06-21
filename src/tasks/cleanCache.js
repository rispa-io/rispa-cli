const { removePluginsCache } = require('../utils/pluginsCache')

const cleanCacheTask = ({ projectPath }) => {
  removePluginsCache(projectPath)
}

const cleanCache = {
  title: 'Clean cache',
  task: cleanCacheTask,
}

module.exports = cleanCache
