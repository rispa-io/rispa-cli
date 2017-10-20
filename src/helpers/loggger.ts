import dateFormat = require('dateformat')
import chalk from 'chalk'

export function log(line: string) {
  const date = new Date()

  console.log(`${chalk.blueBright(`[${dateFormat(date, 'HH:MM:ss')}]`)} ${line}`)
}
