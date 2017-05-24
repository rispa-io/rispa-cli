/* eslint-disable import/no-dynamic-require, global-require */

const spawn = jest.genMockFromModule('cross-spawn')

function sync(command, args, options) {
  return {
    status: typeof command === 'string'
      && Array.isArray(args)
      && typeof options === 'object' ? 0 : 1,
  }
}

spawn.sync = sync

module.exports = spawn
