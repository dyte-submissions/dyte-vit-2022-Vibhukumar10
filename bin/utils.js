const chalk = require('chalk')
const axios = require('axios')
const usage = chalk.hex('#83aaff')(
  '\nUsage: rely <repo-url> <dependency@version>'
)

const getGithubApiCall = (url) => {
  var getUrl = url.replace('github.com', 'api.github.com/repos')
  getUrl = getUrl + '/contents/package.json'

  return getUrl
}

const getDependencyList = async (url) => {
  const obj = await axios
    .get(url)
    .then((response) => {
      //   console.log(response.data.content)
      const obj = JSON.parse(
        Buffer.from(response.data.content, 'base64').toString('ascii')
      ).dependencies
      return obj
    })
    .catch((err) => {
      console.log(err.message)
    })

  return obj
}

const getAppVersion = (obj, dependency) => {
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && key === dependency) {
      //   console.log(obj[key])
      return obj[key]
    }
  }
}

const showHelp = () => {
  console.log(usage)
  console.log('\nOptions:\r')
  console.log(
    '\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r'
  )
  console.log(
    '    -l, --languages\t' +
      '      ' +
      'List all languages.' +
      '\t\t' +
      '[boolean]\r'
  )
  console.log('\t--help\t\t      ' + 'Show help.' + '\t\t\t' + '[boolean]\n')
}

module.exports = {
  getGithubApiCall,
  showHelp,
  getDependencyList,
  getAppVersion,
}
