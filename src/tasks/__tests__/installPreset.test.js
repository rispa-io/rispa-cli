jest.mock('../../utils/useYarn')
jest.mock('../../utils/preset')

const mockUseYarn = require.requireMock('../../utils/useYarn')
const mockPreset = require.requireMock('../../utils/preset')

const installPreset = require.requireActual('../installPreset')

describe('installPreset', () => {
  const preset = 'preset'
  it('should success run via yarn', () => {
    mockPreset.findPresetInDependencies.mockImplementationOnce(() => preset)

    const ctx = {
      yarn: true,
      preset,
      configuration: {},
    }

    installPreset.task(ctx)

    expect(mockPreset.installPresetYarn).toBeCalled()

    expect(ctx).toHaveProperty('configuration.extends', preset)
  })

  it('should success run via npm', () => {
    mockPreset.findPresetInDependencies.mockImplementationOnce(() => preset)
    mockUseYarn.checkUseYarnLerna.mockImplementationOnce(() => false)

    const ctx = {
      preset,
      configuration: {},
    }

    installPreset.task(ctx)

    expect(mockPreset.installPresetNpm).toBeCalled()

    expect(ctx).toHaveProperty('configuration.extends', preset)
  })
})
