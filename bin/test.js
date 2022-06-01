const utils = require('./utils')

let oldContent = () => {
  return utils
    .getOldContent(
      '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',
      'https://github.com/dyte-in/react-sample-app'
    )
    .then((data) => {
      return data
    })
}

console.log(oldContent)
