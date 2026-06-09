module.exports = {
  '*.{js,jsx,ts,tsx}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `next lint --fix ${filenames.map((f) => `--file ${f}`).join(' ')}`,
    `npm test -- --findRelatedTests ${filenames.join(' ')}`
  ]
}
