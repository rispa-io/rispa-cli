#!/usr/bin/env node

/* eslint-disable no-console, import/no-dynamic-require, global-require */

const spawn = require('cross-spawn')
const path = require('path')
const fs = require('fs')

const { handleError, requireIfExist } = require('../src/core')

const RUN_PATH = process.cwd()
const LOCAL_VERSION_PATH = path.resolve(RUN_PATH, './node_modules/.bin/ris')

const runCommand = args => {
  const commands = {
    run: () => require('../src/runScript'),
    new: () => require('../src/createProject'),
    add: () => require('../src/addPlugins'),
    update: () => require('../src/updatePlugins'),
    remove: () => require('../src/removePlugins'),
  }

  const commandName = args[0] || ''

  if (commandName in commands) {
    commands[commandName]()(...args.slice(1)).catch(handleError)
  } else {
    commands.run()(...args).catch(handleError)
  }
}

const isGlobalRun = () => {
  const execPath = process.argv[1]
  return execPath.indexOf(['node_modules', '.bin'].join(path.sep)) === -1 &&
    execPath.indexOf(['node_modules', '@rispa', 'cli'].join(path.sep)) === -1
}

const canRunLocalVersion = () => {
  const packageJsonPath = path.resolve(RUN_PATH, './package.json')
  const { dependencies, devDependencies } = requireIfExist(packageJsonPath)

  const deps = Object.assign({}, dependencies, devDependencies)
  if (Object.keys(deps).indexOf('@rispa/cli') !== -1) {
    if (fs.existsSync(LOCAL_VERSION_PATH)) {
      return true
    }

    handleError('Can\'t find local version of cli in node_modules.')
  }

  return false
}

const runLocalVersion = args => {
  console.log('Switch to use local version')

  const result = spawn.sync(
    'node',
    [LOCAL_VERSION_PATH].concat(args),
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
