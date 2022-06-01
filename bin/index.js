#! /usr/bin/env node

const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs')
const { Octokit } = require('@octokit/rest')
const { compare, validate } = require('compare-versions')
const { default: simpleGit, CleanOptions } = require('simple-git')
simpleGit().clean(CleanOptions.FORCE)

const options = {
  baseDir: process.cwd(),
  binary: 'git',
  maxConcurrentProcesses: 6,
}

// when setting all options in a single object
const git = simpleGit(options)

// console.log(yargs)

const csv = require('csvtojson')

const utils = require('./utils.js')

const usage = chalk.keyword('green')(
  '\nUsage: rely <repo-url> <dependency@version>'
)

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

// console.log(argv)

if (argv.i && argv.r == null) {
  const csvFileName = argv.i[0]
  try {
    const csvPath = utils.getCsvPath(csvFileName)
    ;(async () => {
      const data = await csv().fromFile(csvPath)
      console.log(data)
    })()

    // var fs = require('fs')

    // var data = fs
    //   .readFileSync(csvPath)
    //   .toString() // convert Buffer to string
    //   .split('\n') // split string to lines
    //   .map((e) => e.trim()) // remove white spaces for each line
    //   .map((e) => e.split(',').map((e) => e.trim())) // split each line to array

    // console.log(data.slice(1))
    // console.log(JSON.stringify(data, '', 2)) // as json
  } catch (err) {
    console.log(boxen(chalk.red(err.message)))
  }
} else if (argv.r && argv.i == null) {
  const url = argv.r[0]
  try {
    const getUrl = utils.getGithubApiCall(url)
    const [dependency, version] = argv.r[1].split('@')
    console.log(dependency, version)

    if (!validate(version)) {
      throw new Error('Please enter a valid version like: react@17.0.0')
    }

    utils
      .getDependencyList(getUrl)
      .then((data) => {
        console.log(data)
        var appVersion = utils.getAppVersion(data, dependency).toString()

        console.log(`\nShowing dependency versions for ${dependency}:`)
        console.log(
          chalk.blue(boxen(`current: ${appVersion}\nrequirement: ${version}`))
        )

        if (!compare(appVersion, version, '>=')) {
          console.log(
            chalk.red(
              `${dependency}@${appVersion} DOESNOT satisfy ${dependency}@${version}\nPlease update using the -u flag`
            )
          )
        } else {
          console.log(chalk.green('Your dependency is upto date :)'))
        }

        if (argv.u) {
          const accessToken = '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'
          try {
            // utils.forkRepo(accessToken, url).then(() => console.log('forked'))
            utils
              .createBranch(accessToken, url)
              .then(() => console.log('created'))
          } catch (err) {
            console.log(err.message)
          }
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
