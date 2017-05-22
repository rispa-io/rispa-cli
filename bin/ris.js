#!/usr/bin/env node
'use strict';

const spawn = require('cross-spawn')
const fs = require('fs')
const glob = require('glob')
const path = require('path')

const packageName = process.argv[2]
const command = process.argv[3]
const args = process.argv.slice(4)

const lernaJson = requireIfExist("../lerna.json");

const packagePaths = ['node_modules/*'].concat(lernaJson && lernaJson.packages ? lernaJson.packages : [])

const packages = packagePaths.map(packagePath =>
  glob.sync(packagePath).reduce((result, packageFolder) => {
    const packageJson = requireIfExist(`../${packageFolder}/package.json`)
    if (!packageJson || !packageJson['rispa:plugin']) {
      return result
    }

    const rispaName = packageJson['rispa:name']
    if (packageName === 'all' && !(packageJson.scripts && command in packageJson.scripts)) {
      return result
    }

    const packageInfo = {
      path: packageFolder,
      alias: rispaName,
      name: packageJson['name']
    }

    if (rispaName) {
      result[rispaName] = packageInfo
    }

    result[packageInfo.name] = packageInfo

    return result
  }, {})
).reduce((result, currentResult) => Object.assign(result, currentResult))

if (packages !== 'all' && !packages[packageName]) {
  console.log(`Can't find package with name: ${packageName}.\n\nList of available packages:`)
  printPackages(packages);

  process.exit(1)
}

const result = callScript(packageName, packages, command, args)
process.exit(result)

function printPackages(packages) {
  Object.keys(packages).forEach((key) => {
    const { alias, name } = packages[key];

    if (alias === key) {
      console.log(` - ${alias} - alias for ${name}`)
    } else {
      console.log(` - ${name}`);
    }
  });
}

function callScript(packageName, packages, command, args) {
  if (packageName === 'all') {
    return Object.values(packages).reduce((result, packageInfo) => {
      const res = spawn.sync(
        'yarn',
        [command].concat(args),
        {
          cwd: packageInfo.path,
          stdio: 'inherit',
        })
      return res.status || result
    }, 0)
  } else {
    return spawn.sync(
      'yarn',
      [command].concat(args),
      {
        cwd: packages[packageName].path,
        stdio: 'inherit',
      }
    ).status
  }
}

function requireIfExist(id) {
  try {
    return require(id)
  } catch (e) {
    if (e instanceof Error && e.code === "MODULE_NOT_FOUND") {
      return null
    }
    throw e;
  }
}
