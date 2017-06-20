const performProjectName = projectName => (
  projectName.replace(/\s+/g, '-')
)

module.exports = {
  performProjectName,
}
