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
    const script = callPluginScript(path, scriptName, args)

    return new Promise((resolve, reject) => {
      script.on('error', () => {
        reject('Failed to start script')
      })
      script.on('close', status => {
        if (status !== 0) {
          reject('Failed run plugin script')
        }

        resolve()
      })
    })
  },
})

module.exports = createRunPluginScriptTask
