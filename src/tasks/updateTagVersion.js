const { prompt } = require('inquirer')
const { addTag: gitAddTag } = require('../utils/git')

const selectNextVersion = versions => prompt([{
  type: 'list',
  name: 'nextVersion',
  choices: [{
    name: 'Cancel',
    value: false,
  }].concat(
    Object.keys(versions).map(versionName => ({
      name: `${versionName} ${versions[versionName]}`,
      value: versions[versionName],
    }))
  ),
  message: 'Select next version:',
}])

const createUpdateTagVersion = (path, { newCommitsCount, version, versionParts }) => ({
  title: 'Update tag version',
  task: () => {
    console.log(`${newCommitsCount} new commit(s) after ${version}`)

    const { major, minor, patch } = versionParts
    const versions = {
      PATCH: `${major}.${minor}.${+patch + 1}`,
      MINOR: `${major}.${+minor + 1}.0`,
      MAJOR: `${+major + 1}.0.0`,
    }

    return selectNextVersion(versions)
      .then(({ nextVersion }) => {
        if (nextVersion) {
          if (!gitAddTag(path, `v${nextVersion}`)) {
            throw new Error('Failed git add tag')
          }
        }
      })
  },
})

module.exports = createUpdateTagVersion
