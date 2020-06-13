'use strict'

const fs = require('fs')
const { execSync, spawnSync } = require('child_process')
const commander = require('commander')

const gitRoot = execSync('git rev-parse --show-toplevel').toString('utf8').trim()

process.chdir(gitRoot)

commander.command('update-bundle-remote <bundle name> <remote url>')
commander.parse(process.argv)

const [bundle, remote] = commander.args

if (bundle === 'update-all') {
  spawnSync('git submodule update --init --recursive --remote')

  process.exit(0)
}

if (commander.args.length < 2) {
  console.error(`Syntax: ${process.argv0} <bundle> <remote url>`)
  process.exit(0)
}

if (!fs.existsSync(gitRoot + `/bundles/${bundle}`)) {
  console.error('Not a valid bundle name')
  process.exit(0)
}

try {
  execSync(`git ls-remote ${remote}`)
} catch (err) {
  process.exit(0)
}

console.log('Configuring bundle...')
execSync(`git config -f .gitmodules "submodule.bundles/${bundle}.url" ${remote}`, { stdio: 'ignore' })
console.log('Syncing bundle...')
execSync('git submodule sync', { stdio: 'ignore' })
console.log('Updating bundle...')
execSync('git submodule update --init --recursive --remote', { stdio: 'ignore' })
execSync(`npm run install-bundle ${bundle}`, { stdio: 'ignore' })
