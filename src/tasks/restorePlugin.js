const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const {
  addSubtree: gitGetSubtree,
  cloneRepository: gitCloneRepository,
  getRemotes: gitGetRemotes,
} = require('../utils/git')
const { improveTask, checkMode } = require('../utils/tasks')
const { getPluginName } = require('../utils/plugin')
const { DEV_MODE, PACKAGE_JSON_PATH } = require('../constants')

const createRestorePluginTask = plugin => improveTask({
  title: `Restore plugin with name ${chalk.cyan(getPluginName(plugin))}`,
  task: ctx => {
    const { projectPath, configuration } = ctx
    const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)
    const { name, remote, ref } = plugin

    if (checkMode(ctx, DEV_MODE)) {
      if (!fs.existsSync(path.resolve(pluginsPath, name, PACKAGE_JSON_PATH))) {
        gitCloneRepository(pluginsPath, remote, ref)
      }
    } else {
      const remotesInstalled = gitGetRemotes(projectPath)
      if (!remotesInstalled[name]) {
        const pluginsRelPath = path.relative(projectPath, pluginsPath)
        const prefix = `${pluginsRelPath}/${name}`
        gitGetSubtree(projectPath, prefix, name, remote, ref)
      }
    }
  },
})

module.exports = createRestorePluginTask
