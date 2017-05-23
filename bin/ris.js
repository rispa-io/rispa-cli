#!/usr/bin/env node

/* eslint-disable no-use-before-define, no-console, import/no-dynamic-require, global-require */

const commands = {
  run: require('../src/run'),
  new: require('../src/create'),
}

const command = process.argv[2] || ''
const args = process.argv.slice(3)

if (command in commands) {
  commands[command](...args)
} else {
  commands.run(...process.argv.slice(2))
}
