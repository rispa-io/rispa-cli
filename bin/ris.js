#!/usr/bin/env node

/* eslint-disable no-console, import/no-dynamic-require, global-require */

const { handleError } = require('../src/core')

const commands = {
  run: require('../src/runScript'),
  new: require('../src/createProject'),
  add: require('../src/addPlugins'),
  update: require('../src/updatePlugins'),
  remove: require('../src/removePlugins'),
}

const command = process.argv[2] || ''
const args = process.argv.slice(3)

if (command in commands) {
  commands[command](...args).catch(handleError)
} else {
  commands.run(...process.argv.slice(2)).catch(handleError)
}
