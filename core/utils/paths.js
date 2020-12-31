function structureAsDirectories(updatedPaths) {
  return updatedPaths.reduce((directoriesByLevel, url) => {
    const splitPath = url.split('\\')

    for (let level = 0; level < splitPath.length; level++) {
      
      if (!directoriesByLevel[level]) {
        directoriesByLevel.push({})
      }

      const currentLevel = directoriesByLevel[level]
      const parentDirectoryPath = splitPath.slice(0, level).join('\\')

      if (!currentLevel[parentDirectoryPath]) {
        currentLevel[parentDirectoryPath] = []
      }

      const currentChildren = currentLevel[parentDirectoryPath]
      const currentDirectoryName = splitPath[level]
      const currentDirectoryPath = splitPath.slice(0, level + 1).join('\\')
      const isDirectoryListed = currentChildren.find(childItem => childItem.name === currentDirectoryName)

      if (!isDirectoryListed) {
        currentChildren.push({
          name: currentDirectoryName,
          type: level === splitPath.length - 1 ? 'file' : 'directory', 
          path: currentDirectoryPath
        });
      }
    }

    return directoriesByLevel
  }, []);
}

module.exports = { structureAsDirectories }