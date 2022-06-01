#! /usr/bin/env node

const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs')
const { Octokit } = require('@octokit/rest')
const { compare, validate } = require('compare-versions')
const prompt = require('prompt-sync')()
const csv = require('csvtojson')
const utils = require('./utils.js')
const usage = chalk.keyword('green')('\nUsage: rely <repo-url> <dependency@version>')

const argv = yargs(process.argv.slice(2))
  .usage(
    'Usage: \n\nrely -r <repo-url> <dependency@version>\nrely -i <filname.csv> <dependency@version>'
  )
  .option('r', {
    usage: 'okay',
    nargs: 2,
    describe: 'specify single repo-link',
    type: 'string',
  })
  .option('i', {
    nargs: 2,
    describe: 'take input from a local .csv file',
    type: 'string',
  })
  .option('u', {
    alias: 'update',
    nargs: 0,
    describe: 'specify the dependency to update',
    type: 'boolean',
  })
  .help(true).argv

// ROUTES ------>

if (argv.i && argv.r == null) {
  const csvFileName = argv.i[0]
  const [dependency, version] = argv.i[1].split('@')
  try {
    const csvPath = utils.getCsvPath(csvFileName)
    ;async () => {
      const data = await csv().fromFile(csvPath)
      var rep = []
      data.forEach((obj) => {
        console.log(obj)
        const getUrl = utils.getGithubApiCall(obj.repo)

        utils.getDependencyList(getUrl).then((content) => {
          const appVersion = utils
            .getAppVersion(
              JSON.parse(Buffer.from(content.data.content, 'base64').toString('ascii'))
                .dependencies,
              dependency,
              version
            )
            .toString()

          rep.push({
            version: appVersion,
            satified: compare(appVersion, version, '>='),
          })
        })
        console.log(rep)
      })
    }
  } catch (err) {
    console.log(boxen(chalk.red(err.message)))
  }
} else if (argv.r && argv.i == null) {
  const url = argv.r[0]
  try {
    const getUrl = utils.getGithubApiCall(url)
    const [dependency, version] = argv.r[1].split('@')

    if (!validate(version)) {
      throw new Error('Please enter a valid version like: react@17.0.0')
    }

    utils
      .getDependencyList(getUrl)
      .then((data) => {
        const appVersion = utils
          .getAppVersion(
            JSON.parse(Buffer.from(data.data.content, 'base64').toString('ascii')).dependencies,
            dependency,
            version
          )
          .toString()

        var newPackage = JSON.parse(Buffer.from(data.data.content, 'base64').toString('ascii'))

        if (argv.u) {
          var accessToken = prompt('Please enter your GitHub Person Access Token: ')
          var userName = prompt('Please enter your GitHub Username: ')

          var obj = newPackage.dependencies
          for (var key in newPackage.dependencies) {
            if (obj.hasOwnProperty(key) && key === dependency) {
              newPackage.dependencies[key] = '^' + version
              break
            }
          }

          newPackage = btoa(JSON.stringify(newPackage))
          const genRand = (len) => {
            return Math.random()
              .toString(36)
              .substring(2, len + 2)
          }
          const rand = genRand(5)
          ;(async () => {
            await utils.forkRepo(accessToken, url)
            await utils.createBranch(rand, accessToken, url, userName)
            await utils.makeChanges(rand, accessToken, url, newPackage, data.data.sha)
            await utils
              .createPullRequest(rand, accessToken, url, dependency, appVersion, version, userName)
              .then((obj) => console.log(boxen(chalk.green(`Your PR Link: `, obj.data.html_url))))

            console.log('Pull request made :)')
          })()
        }
      })
      .catch((err) => {
        console.log(err.message)
      })
  } catch (err) {
    console.log(err.message)
  }
} else {
  console.log(boxen(chalk.red(Error('Invalid Input'))))
  utils.showHelp()
}
