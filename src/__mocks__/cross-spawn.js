const spawn = jest.genMockFromModule('cross-spawn')

let mockOutput
const defaultOutput = [null, new Buffer(''), new Buffer('')]
let mockReject = false

spawn.sync = jest.fn((command, args, options) => ({
  status: !mockReject && typeof command === 'string'
  && Array.isArray(args)
  && typeof options === 'object' ? 0 : 1,
  output: mockOutput || defaultOutput,
}))

spawn.setMockOutput = newMockOutput => {
  mockOutput = newMockOutput || defaultOutput
}

spawn.setMockReject = val => {
  mockReject = val
}

module.exports = spawn
