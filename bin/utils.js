const chalk = require('chalk')

const csv = require('csvtojson')

const axios = require('axios')
const usage = chalk.hex('#83aaff')('\nUsage: rely <repo-url> <dependency@version>')

const { Octokit } = require('@octokit/rest')

const gh = require('parse-github-url')
const { compare, validate } = require('compare-versions')
const boxen = require('boxen')

const getGithubApiCall = (url) => {
  const { owner, name } = gh(url)

  if (!owner || !name) {
    throw new Error('This is not a valid github link!')
  } else {
    var getUrl = `https://api.github.com/repos/${owner}/${name}/contents/package.json`
    return getUrl
  }
}

const getDependencyList = async (url) => {
  const { owner, name } = gh(url)
  const octokit = new Octokit({
    // auth: accessToken,
  })

  const obj = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: owner,
    repo: name,
    path: 'package.json',
  })

  // JSON.parse(Buffer.from(obj.data.content, 'base64').toString('ascii'))
  //   .dependencies
  return obj
}

const getAppVersion = (obj, dependency, version) => {
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

  console.log(`\nShowing dependency versions for ${dependency}:`)
  console.log(chalk.blue(boxen(`current: ${appVersion}\nrequirement: ${version}`)))

  if (!compare(appVersion, version, '>=')) {
    console.log(
      chalk.red(
        `${dependency}@${appVersion} DOESNOT satisfy ${dependency}@${version}\nPlease update using the -u flag`
      )
    )
  } else {
    console.log(chalk.green('Your dependency is upto date :)'))
  }

  return appVersion
}

const showHelp = () => {
  console.log(usage)
  console.log('\nOptions:\r')
  console.log('\t--version\t      ' + 'Show version number.' + '\t\t' + '[boolean]\r')
  console.log('    -i, --inp\t' + '      ' + 'Take input from a .csv file' + '\t\t' + '[boolean]\r')
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
}

const createBranch = async (rand, accessToken, url, user) => {
  const { owner, name } = gh(url)

  const octokit = new Octokit({
    auth: accessToken,
  })

  var obj
  try {
    obj = await octokit.request('GET /repos/{owner}/{repo}/commits/main', {
      owner: owner,
      repo: name,
    })
  } catch (error) {
    console.log(error.message)
  }

  try {
    const latestSha = obj.data.sha
    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: user,
      repo: name,
      ref: `refs/heads/update-dependency#${rand}`,
      sha: latestSha,
    })
  } catch (err) {
    console.log(err.message)
  }
}

const getOldContent = async (accessToken, url) => {
  const { owner, name } = gh(url)

  const octokit = new Octokit({
    auth: accessToken,
  })

  const obj = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: owner,
    repo: name,
    path: 'package.json',
  })
  return obj
}

const makeChanges = async (rand, accessToken, url, newPackage, sha) => {
  try {
    const { owner, name } = gh(url)

    const octokit = new Octokit({
      auth: accessToken,
    })
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: 'Vibhukumar10',
      repo: name,
      path: 'package.json',
      message: 'update-dependecy',
      branch: `update-dependency#${rand}`,
      content: newPackage,
      sha,
    })
  } catch (error) {
    console.log(error.message)
  }
}

const createPullRequest = async (
  rand,
  accessToken,
  url,
  dependency,
  appVersion,
  version,
  userName
) => {
  const { owner, name } = gh(url)

  const octokit = new Octokit({
    auth: accessToken,
  })

  const obj = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: name,
    title: `chore: update ${dependency}@${appVersion} to ${dependency}@${version}`,
    body: 'Please pull these awesome changes in!',
    head: `${userName}:update-dependency#${rand}`,
    base: 'main',
  })

  return obj
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
  createPullRequest,
  makeChanges,
  getOldContent,
}
