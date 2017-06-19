const spawn = jest.genMockFromModule('cross-spawn')

let mockOutput
const defaultOutput = [null, new Buffer(''), new Buffer('')]

const sync = jest.fn((command, args, options) => ({
  status: typeof command === 'string'
    && Array.isArray(args)
    && typeof options === 'object' ? 0 : 1,
  output: mockOutput || defaultOutput,
}))

spawn.sync = sync

spawn.setMockOutput = newMockOutput => {
  mockOutput = newMockOutput || defaultOutput
}

module.exports = spawn
