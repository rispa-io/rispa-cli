const { postinstall } = require('../utils/postinstall')

const postinstallTask = {
  title: 'Run postinstall scripts',
  task: ctx => postinstall(ctx.projectPath),
}

module.exports = postinstallTask
