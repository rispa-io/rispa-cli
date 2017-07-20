const R = require('ramda')
const chalk = require('chalk')
const { checkUseYarnLerna } = require('../utils/useYarn')
const { installPresetYarn, installPresetNpm, findPresetInDependencies } = require('../utils/preset')

const installPreset = {
  title: 'Install preset',
  enabled: R.compose(Boolean, R.propOr(false, 'preset')),
  task: ctx => {
    if (!('yarn' in ctx)) {
      ctx.yarn = checkUseYarnLerna(ctx.projectPath)
    }

    console.log(chalk.bold.cyan(`Using preset ${ctx.preset}`))

    if (ctx.yarn) {
      installPresetYarn(ctx.preset, ctx.projectPath)
    } else {
      installPresetNpm(ctx.preset, ctx.projectPath)
    }

    ctx.configuration.extends = findPresetInDependencies(ctx.preset, ctx.projectPath)
  },
}

module.exports = installPreset
