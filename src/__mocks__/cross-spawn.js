const spawn = jest.genMockFromModule('cross-spawn')

const sync = jest.fn((command, args, options) => ({
  status: typeof command === 'string'
    && Array.isArray(args)
    && typeof options === 'object' ? 0 : 1,
}))

spawn.sync = sync

module.exports = spawn
