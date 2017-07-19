const path = require('path')
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const Command = require('../Command')
const { readPackageJson } = require('../utils/plugin')
const { LERNA_JSON_PATH } = require('../constants')

const searchForFile = (dir, filename) => {
  let rootDir
  let currentDir = dir
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.resolve(currentDir, filename))) {
      rootDir = currentDir
      break
    }

    currentDir = path.dirname(currentDir)
  }

  return rootDir
}

class CommitCommand extends Command {
  init() {
    this.add([
      {
        title: 'Search for rispa-postinstall script',
        task: ctx => {
          const packageJson = readPackageJson(ctx.cwd)
          const postinstallScript = (
            packageJson &&
            packageJson.scripts &&
            packageJson.scripts['rispa-postinstall']
          )

          if (!postinstallScript) {
            throw new Error('Can\'t find rispa-postinstall script')
          }

          ctx.postinstallScript = postinstallScript
        },
      },
      {
        title: 'Search for project root',
        task: ctx => {
          const projectPath = searchForFile(ctx.cwd, LERNA_JSON_PATH)
          if (!projectPath) {
            throw new Error('Can\'t find rispa project root')
          }

          ctx.projectPath = projectPath
        },
      },
      {
        title: 'Run rispa-postinstall script',
        task: ({ postinstallScript, projectPath }) => {
          const commands = postinstallScript.split('&&')
          commands.forEach(command => {
            const args = command.trim().split(/\s+/)
            spawn.sync(
              args[0],
              args.slice(1),
              {
                cwd: projectPath,
                stdio: 'inherit',
              }
            )
          })
        },
      },
    ])
  }
}

CommitCommand.commandName = 'postinstall'
CommitCommand.commandDescription = 'Postinstall script'

module.exports = CommitCommand
