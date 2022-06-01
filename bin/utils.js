const chalk = require('chalk')

const csv = require('csvtojson')

const axios = require('axios')
const usage = chalk.hex('#83aaff')(
  '\nUsage: rely <repo-url> <dependency@version>'
)

const { Octokit } = require('@octokit/rest')

const gh = require('parse-github-url')
const { compare } = require('compare-versions')

const getGithubApiCall = (url) => {
  const { owner, name } = gh(url)
  console.log(owner, name)

  if (!owner || !name) {
    throw new Error('This is not a valid github link!')
  } else {
    var getUrl = `https://api.github.com/repos/${owner}/${name}/contents/package.json`
    return getUrl
  }
}

const getDependencyList = async (url) => {
  // const obj = await axios
  //   .get(url)
  //   .then((response) => {
  //     //   console.log(response.data.content)
  //     const obj = JSON.parse(
  //       Buffer.from(response.data.content, 'base64').toString('ascii')
  //     ).dependencies
  //     return obj
  //   })
  //   .catch((err) => {
  //     console.log(
  //       chalk.red(
  //         'Either the repository doesnot exist or there is no package.json in its root\n'
  //       ),
  //       err.message
  //     )
  //   })

  const { owner, name } = gh(url)
  const octokit = new Octokit({
    auth: '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',
  })

  const obj = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    {
      owner: owner,
      repo: name,
      path: 'package.json',
    }
  )
  return JSON.parse(Buffer.from(obj.data.content, 'base64').toString('ascii'))
    .dependencies
}

const validateDependency = async () => {}

const getAppVersion = (obj, dependency) => {
  var appVersion
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && key === dependency) {
      //   console.log(obj[key])
      appVersion = obj[key]
      break
    }
  }
  if (appVersion.charAt(0) < '0' || appVersion.charAt(0) > '9') {
    appVersion = appVersion.slice(1)
  }
  return appVersion
}

const showHelp = () => {
  console.log(usage)
  console.log('\nOptions:\r')
  console.log(
    '\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r'
  )
  console.log(
    '    -i, --inp\t' +
      '      ' +
      'Take input from a .csv file' +
      '\t\t' +
      '[boolean]\r'
  )
  console.log('\t--help\t\t      ' + 'Show help.' + '\t\t\t' + '[boolean]\n')
}

const parseCsv = async (csvPath) => {
  return await csv().fromFile(csvPath)
}

const getCsvPath = (csvFileName) => {
  if (csvFileName.slice(-4) !== '.csv') {
    throw new Error('Cheeky! Only [.csv] file-type is supported!')
  } else {
    const csvPath = process.cwd() + '\\' + csvFileName
    // console.log(csvPath)
    return csvPath
  }
}

const forkRepo = async (accessToken, url) => {
  const { owner, name } = gh(url)

  try {
    const octokit = new Octokit({
      auth: accessToken,
    })

    await octokit.request('POST /repos/{owner}/{repo}/forks', {
      owner: owner,
      repo: name,
    })
  } catch (err) {
    console.log(err.message)
  }

  // console.log('done')

  // await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
  //   owner: 'Vibhukumar10',
  //   repo: name,
  //   ref: 'refs/heads/featureA',
  //   sha: 'aa218f56b14c9653891f9e74264a383fa43fefbd',
  // })

  // const octokit = new Octokit({
  //   auth: accessToken,
  // })

  // await octokit.request('POST /repos/{owner}/{repo}/pulls', {
  //   owner: owner,
  //   repo: name,
  //   title: 'Amazing new feature',
  //   body: 'Please pull these awesome changes in!',
  //   head: 'octocat:new-feature',
  //   base: 'master',
  // })
}

const createBranch = async (accessToken, url) => {
  const { owner, name } = gh(url)

  try {
    const octokit = new Octokit({
      auth: accessToken,
    })

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: owner,
      repo: name,
      ref: 'refs/heads/featureA',
      sha: 'aa218f56b14c9653891f9e74264a383fa43fefbe',
    })
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  getGithubApiCall,
  showHelp,
  getDependencyList,
  getAppVersion,
  parseCsv,
  getCsvPath,
  forkRepo,
  createBranch,
}
