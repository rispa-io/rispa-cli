const chalk = require('chalk')
const { checkUseYarn } = require('../utils/useYarn')
const { createCallPluginScript } = require('../utils/packageScript')

const createRunPluginScriptTask = (name, path, scriptName, args) => ({
  title: `Run plugin ${chalk.cyan(name)} script ${chalk.cyan(scriptName)}`,
  task: ctx => {
    if (!('yarn' in ctx)) {
      ctx.yarn = checkUseYarn(path)
    }

    const callPluginScript = createCallPluginScript(ctx.yarn)
    const status = callPluginScript(path, scriptName, args)
    if (status !== 0) {
      throw new Error('Failed run plugin script')
    }
  },
})

module.exports = createRunPluginScriptTask
