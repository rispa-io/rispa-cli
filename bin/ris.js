#!/usr/bin/env node
'use strict';

const spawn = require('cross-spawn')
const glob = require('glob')
const path = require('path')

const packageName = process.argv[2]
const command = process.argv[3]
const args = process.argv.slice(4)

const packageNames = glob.sync('./packages/*').reduce((result, packageFolder) => {
  const packageJson = require(`../${packageFolder}/package.json`)
  const rispaName = packageJson['rispa:name']
  if (packageName === 'all' && !(packageJson['scripts'] && command in packageJson['scripts'])) {
    return result
  }
  if (rispaName) {
    result[rispaName] = packageFolder
  } else {
    result[packageJson['name']] = packageFolder
  }

  return result
}, {})

if (packageName !== 'all' && !packageNames[packageName]) {
  console.log(`Can't find package with name: ${packageName}.\n\nList of available packages:\n - ${Object.keys(packageNames).join('\n - ')}`)
  process.exit(1)
}


const result = callScript(packageName, packageNames, command, args)
process.exit(result)

function callScript(packageName, packageNames, command, args){
  if (packageName === 'all') {
    return Object.values(packageNames).reduce( (result, path) => {
      const res = spawn.sync(
        'yarn',
        [command].concat(args),
        {
          cwd: path,
          stdio: 'inherit'
        })
      return res.status || result
    }, 0 )
  } else {
    return spawn.sync(
      'yarn',
      [command].concat(args),
      {
        cwd: packageNames[packageName],
        stdio: 'inherit'
      }
    ).status
  }
}
