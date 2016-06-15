import { install } from 'source-map-support';
install();

import { IRobot } from 'hubot';

import HelloScript from './scripts/hello';
import BuildScript from './scripts/build';
import DeployScript from './scripts/deploy';

import { AppVeyor } from './lib/appveyor';
import { Config } from './lib/config';

const appVeyor = new AppVeyor(Config.appveyor.token, Config.appveyor.account);

module.exports = (robot: IRobot) => {
  HelloScript(robot);
  BuildScript(robot, appVeyor);
  DeployScript(robot);
};