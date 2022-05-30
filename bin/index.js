#! /usr/bin/env node

const axios = require('axios')
const chalk = require('chalk')
const boxen = require('boxen')
const yargs = require('yargs')

const utils = require('./utils.js')

const usage = chalk.keyword('green')(
  '\nUsage: rely <repo-url> <dependency@version>'
)

const options = yargs
  .usage(usage)
  .option('l', {
    alias: 'languages',
    describe: 'List all supported languages.',
    type: 'boolean',
    demandOption: false,
  })
  .help(true).argv

// if (yargs.argv.l == true || yargs.argv.languages == true) {
//   utils.showAll()
//   return
// }

if (yargs.argv._.length === 0) {
  utils.showHelp()
} else if (yargs.argv._[0] != null && yargs.argv._[1] == null) {
  const url = yargs.argv._[0]
  const getUrl = utils.getGithubApiCall(url)

  utils
    .getDependencyList(getUrl)
    .then((data) => {
      console.log(data)
    })
    .catch((err) => {
      console.log(err.message)
    })
} else if (yargs.argv._[0] != null && yargs.argv._[1] != null) {
  const url = yargs.argv._[0]
  const getUrl = utils.getGithubApiCall(url)
  const [dependency, version] = yargs.argv._[1].split('@')

  console.log(dependency, version)

  utils
    .getDependencyList(getUrl)
    .then((data) => {
      console.log(data)
      var appVersion = utils.getAppVersion(data, dependency).toString()
      //   for (var key in Objectdata) {
      //     if (p.hasOwnProperty(key)) {
      //       console.log(key + ' -> ' + p[key])
      //     }
      //   }

      //   console.log(appVersion)
      if (appVersion.charAt(0) === '^') {
        appVersion = appVersion.replace('^', '')
      }

      console.log(appVersion)

      if (appVersion < version) {
        console.log('Your version is older than specified!')
      }
    })
    .catch((err) => {
      console.log(err.message)
    })
}

console.log(yargs.argv._)

// console.log(usage)
