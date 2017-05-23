#!/usr/bin/env node
'use strict';

const commands = {
  'run': require('../src/run'),
  'new': require('../src/create')
}

const command = process.argv[2].toLowerCase();
const args = process.argv.slice(3)

if (command in commands) {
  commands[command](...args)
} else {
  commands.run(...process.argv.slice(2));
}