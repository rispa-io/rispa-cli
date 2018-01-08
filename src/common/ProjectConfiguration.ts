import Plugin from '../common/Plugin'

export default interface ProjectConfiguration {
  mode: 'dev' | 'prod'
  plugins: Plugin[]
}
