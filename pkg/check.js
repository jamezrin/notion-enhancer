/*
 * notion-enhancer
 * (c) 2020 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/) (https://dragonwocky.me/)
 * under the MIT license
 */

'use strict';

const fs = require('fs-extra'),
  path = require('path'),
  { getNotionResources } = require('./helpers.js'),
  { version } = require('../package.json');

module.exports = async function () {
  const __notion = getNotionResources(),
    resolvePath = (filepath) => path.resolve(`${__notion}/${filepath}`),
    pathExists = (filepath) => fs.pathExists(resolvePath(filepath)),
    version_path = resolvePath('ENHANCER_VERSION.txt'),
    packed = await pathExists('app.asar.bak');

  async function determineBackup() {
    if (packed) {
      return 'app.asar.bak';
    }

    if (await pathExists('app.bak')) {
      return 'app.bak';
    }

    return undefined;
  }

  async function determineExecutable() {
    if (await pathExists('resources/app.asar')) {
      return 'resources/app.asar';
    }

    if (await pathExists('app.asar')) {
      return 'app.asar';
    }

    if (await pathExists('app')) {
      return 'app';
    }

    return undefined;
  }

  let backup = await determineBackup();

  if (!(await pathExists(version_path))) {
    let executable = await determineExecutable();

    if (!executable && backup) {
      backup = resolvePath(backup);
      executable = backup.replace(/\.bak$/, '');
      await fs.move(backup, executable);
    } else {
      executable = executable ? resolvePath(executable) : '';
    }

    if (executable) {
      return {
        code: 0,
        msg: `notion-enhancer has not been applied.`,
        executable,
      };
    }

    return {
      code: 1,
      msg: `notion installation has been corrupted: no executable found.`,
    };
  }

  const installed_version = await fs.readFile(resolvePath(version_path), 'utf8');

  const meta = {
    version: installed_version,
    executable: resolvePath('app'),
    packed: resolvePath(packed),
    backup: resolvePath(backup),
  };

  if (installed_version === version) {
    return {
      code: 2,
      msg: `notion-enhancer v${version} applied.`,
      ...meta,
    };
  }

  return {
    code: 3,
    msg: `notion-enhancer v${installed_version} found applied != v${version} package.`,
    ...meta,
  };
};
