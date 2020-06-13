'use strict'

const fs = require('fs')
const cp = require('child_process')
const os = require('os')
const commander = require('commander')
const parse = require('git-url-parse')

const gitRoot = cp.execSync('git rev-parse --show-toplevel').toString('utf8').trim()
process.chdir(gitRoot)

commander.command('install-bundle <remote url>')
commander.parse(process.argv)

if (commander.args.length < 1) {
  console.error(`Syntax: ${process.argv0} <remote url>`)

  process.exit(0)
}

function getDirectories (path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory()
  })
}

const [remote] = commander.args

if (remote === 'install-all') {
  const dirs = getDirectories('./bundles')

  for (const dir of dirs) {
    if (fs.existsSync(`${gitRoot}/bundles/${dir}/package.json`)) {
      const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'
      cp.spawnSync(npmCmd, ['install', '--no-audit'], {
        cwd: `${gitRoot}/bundles/${dir}`
      })
    }
  }

  process.exit(0)
}

const { name } = parse(remote)

if (fs.existsSync(gitRoot + `/bundles/${remote}`)) {
  console.error('Bundle already installed')

  console.log('Installing dependencies...')
  if (fs.existsSync(`${gitRoot}/bundles/${name}/package.json`)) {
    const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'
    cp.spawnSync(npmCmd, ['install', '--no-audit'], {
      cwd: `${gitRoot}/bundles/${name}`
    })
  }

  process.exit(0)
}

try {
  cp.execSync(`git ls-remote ${remote}`)
} catch (err) {
  process.exit(0)
}

console.log('Adding bundle...')
cp.execSync(`git submodule add ${remote} bundles/${name}`)
cp.execSync('git submodule init')

console.log('Installing dependencies...')
if (fs.existsSync(`${gitRoot}/bundles/${name}/package.json`)) {
  const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'
  cp.spawnSync(npmCmd, ['install', '--no-audit'], {
    cwd: `${gitRoot}/bundles/${name}`
  })
}

console.log(`Bundle installed. Commit the bundle with: git commit -m "Added ${name} bundle"`)
