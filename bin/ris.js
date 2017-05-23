#!/usr/bin/env node

/* eslint-disable no-console, import/no-dynamic-require, global-require */

const commands = {
  run: require('../src/runScript'),
  new: require('../src/createProject'),
  add: require('../src/addPlugin'),
}

const command = process.argv[2] || ''
const args = process.argv.slice(3)

if (command in commands) {
  commands[command](...args)
} else {
  commands.run(...process.argv.slice(2))
}
