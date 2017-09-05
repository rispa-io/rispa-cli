const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const {
  addSubtree: gitGetSubtree,
  cloneRepository: gitCloneRepository,
  getRemotes: gitGetRemotes,
} = require('../utils/git')
const { improveTask, checkMode } = require('../utils/tasks')
const { DEV_MODE, PACKAGE_JSON_PATH } = require('../constants')

const createRestorePluginTask = name => improveTask({
  title: `Restore plugin with name ${chalk.cyan(name)}`,
  task: ctx => {
    const { projectPath, configuration } = ctx
    const { remotes } = configuration
    const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)

    if (checkMode(ctx, DEV_MODE)) {
      if (!fs.existsSync(path.resolve(pluginsPath, name, PACKAGE_JSON_PATH))) {
        gitCloneRepository(pluginsPath, remotes[name])
      }
    } else {
      const remotesInstalled = gitGetRemotes(projectPath)
      if (!remotesInstalled[name]) {
        const pluginsRelPath = path.relative(projectPath, pluginsPath)
        const prefix = `${pluginsRelPath}/${name}`
        gitGetSubtree(projectPath, prefix, name, remotes[name])
      }
    }
  },
})

module.exports = createRestorePluginTask
