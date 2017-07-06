#!/usr/bin/env node

// TODO: Add text for sudo block reason
require('sudo-block')()

const spawn = require('cross-spawn')
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const createDebug = require('debug')
const globalPrefix = require('global-prefix')
const { CWD, LOCAL_VERSION_PATH, PACKAGE_JSON_PATH } = require('../src/constants')

const RunPluginScriptCommand = require('../src/commands/runPluginScript')
const CreateProjectCommand = require('../src/commands/createProject')
const AddPluginsCommand = require('../src/commands/addPlugins')
const RemovePluginsCommand = require('../src/commands/removePlugins')
const UpdatePluginsCommand = require('../src/commands/updatePlugins')
const GenerateCommand = require('../src/commands/generate')
const CommitCommand = require('../src/commands/commit')
const AssembleCommand = require('../src/commands/assemble')
const CleanCacheCommand = require('../src/commands/cleanCache')
const ReleaseCommand = require('../src/commands/release')

const commands = [
  RunPluginScriptCommand,
  CreateProjectCommand,
  AddPluginsCommand,
  RemovePluginsCommand,
  UpdatePluginsCommand,
  GenerateCommand,
  CommitCommand,
  AssembleCommand,
  ReleaseCommand,
  CleanCacheCommand,
]

const logError = createDebug('rispa:error:cli')

const handleError = e => {
  logError(e)
  if (e.errors) {
    e.errors.forEach(error => logError(error))
  }
  if (e.context) {
    logError('Context:')
    logError(e.context)
  }
  process.exit(1)
}

const parseArgs = args => {
  const paramRegExp = /^--([^=]+)=(.*)/
  const argv = args.filter(arg => !paramRegExp.test(arg))

  const params = args.reduce((result, arg) => {
    const paramMatch = paramRegExp.exec(arg)
    if (paramMatch) {
      try {
        result[paramMatch[1]] = JSON.parse(paramMatch[2])
      } catch (e) {
        result[paramMatch[1]] = paramMatch[2]
      }
    }
    return result
  }, {})

  return [argv, params]
}

const runCommand = ([firstArg = '', ...args]) => {
  let Command = commands.find(command => command.commandName === firstArg)
  if (!Command) {
    Command = RunPluginScriptCommand
    args.unshift(firstArg)
  }

  const [argv, params] = parseArgs(args)

  const command = new Command(argv)
  command.init()
  command.run(Object.assign(params, {
    cwd: CWD,
  })).catch(handleError)
}

const inGlobalModules = fullpath => {
  // Check if script is executed from yarn global dir
  const isYarnGlobal = fullpath.indexOf(['config', 'global', 'node_modules'].join(path.sep)) >= 0

  return fullpath.indexOf(globalPrefix) === 0 || isYarnGlobal
}

const isGlobalRun = () => {
  const execPath = fs.realpathSync(process.argv[1])

  return inGlobalModules(execPath)
}

const canRunLocalVersion = () => {
  const packageJsonPath = path.resolve(CWD, PACKAGE_JSON_PATH)

  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const { dependencies = {}, devDependencies = {} } = fs.readJsonSync(packageJsonPath)

  const deps = Object.keys(dependencies).concat(Object.keys(devDependencies))
  if (deps.indexOf('@rispa/cli') !== -1) {
    if (fs.existsSync(LOCAL_VERSION_PATH)) {
      return true
    }

    console.log(chalk.red(`Can't find local version of CLI in ${chalk.cyan('node_modules')}`))
    process.exit(1)
  }

  return false
}

const runLocalVersion = args => {
  console.log(chalk.bold.green('Switch to use local version'))

  const result = spawn.sync(
    LOCAL_VERSION_PATH,
    args,
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  ).status

  process.exit(result)
}

const args = process.argv.slice(2)

if (isGlobalRun() && canRunLocalVersion()) {
  runLocalVersion(args)
} else {
  runCommand(args)
}
