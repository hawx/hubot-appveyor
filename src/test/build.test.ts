import { test } from 'ava';
import * as sinon from 'sinon';

import { MockRobot, MockRobotBrain, MockResponse, MockScopedHttpClient, MockSlackAdapter, MockAppVeyor } from './helpers/mocks';
import { IHttpClientHandler } from 'hubot';
import { ICustomMessage } from 'hubot-slack';
import * as express from 'express';
import { Config } from '../lib/config';
import BuildScript from '../scripts/build';

test('finbot > starts a build', (t) => {
  // arrange
  const project = 'a project slug';
  const room = 'a room';
  const version = 'this is a version';
  const token = '12345';
  const account = 'some account';
  const username = 'a name';

  const robot = new MockRobot();
  const respondStub = sinon.stub(robot, 'respond');

  const robotBrain = new MockRobotBrain();
  robot.brain = robotBrain;
  const brainSetSpy = sinon.spy(robotBrain, 'set');

  const robotRouter = express();
  robot.router = robotRouter;

  const response = new MockResponse();
  const replyStub = sinon.stub(response, 'reply');

  response.match = [null, project];
  response.message = {
    room: room,
    user: { name: username }
  };

  const slackAdapter = new MockSlackAdapter();
  const customMessageSpy = sinon.spy(slackAdapter, 'customMessage');

  robot.adapter = slackAdapter;

  const expectedLink = `https://ci.appveyor.com/project/${account}/${project}/build/${version}`;

  const appVeyorStub = MockAppVeyor.builds({
    projectSlug: project,
    accountName: account,
    version: version,
    link: expectedLink
  });

  const expectedCustomMessage: ICustomMessage = {
    channel: room,
    text: 'Build started',
    attachments: [
      {
        fallback: `Started build of '${project}' v${version}: ${expectedLink}`,
        title: `Started build of '${project}'`,
        title_link: expectedLink,
        text: `v${version}`,
        color: '#7CD197'
      }
    ]
  };

  // act
  BuildScript(robot, appVeyorStub);

  process.nextTick(() => {
    // assert
    t.true(respondStub.calledWith(/start build (.*)/i, sinon.match.func));

    t.true(customMessageSpy.calledWith(sinon.match(expectedCustomMessage)));
    t.true(brainSetSpy.calledWith(`${project}/${version}`, `{"username":"${username}"}`));
  });
});

test('finbot > notifies on build completion', (t) => {
  // arrange
  const channel = 'a-channel';
  const token = '0123456789abc';
  const project = 'my-awesome-project';
  const version = '999.885.222';
  const username = 'some_guy';

  Config.announce_channel = channel;
  Config.appveyor.webhook.token = token;

  const robot = new MockRobot();
  const robotBrain = new MockRobotBrain();
  const robotRouter = express();

  robot.brain = robotBrain;
  robot.router = robotRouter;

  const brainGetStub = sinon.stub(robotBrain, 'get');
  brainGetStub.returns(`{"username":"${username}"}`);

  const messageRoomStub = sinon.stub(robot, 'messageRoom');

  const request: express.Request = <any>{
    headers: {
      authorization: token
    },
    body: {
      eventName: 'build_success',
      eventData: {
        projectName: project,
        buildVersion: version
      }
    }
  };

  const sendStub = sinon.stub();
  const response: express.Response = <any>{ send: sendStub };

  const postStub = sinon.stub(robotRouter, 'post');
  postStub.callsArgWith(1, request, response);

  const appVeyorStub = MockAppVeyor.builds({
    projectSlug: project,
    accountName: Config.appveyor.account,
    version: version,
    link: 'http://link'
  });

  const expectedMessage = `Build v${version} of '${project} succeeded. @${username}`;

  // act
  BuildScript(robot, appVeyorStub);

  // assert
  sinon.assert.calledWith(postStub, '/hubot/appveyor/webhook', sinon.match.func);
  sinon.assert.calledWithExactly(brainGetStub, `${project}/${version}`);
  sinon.assert.calledWithExactly(messageRoomStub, channel, expectedMessage);
  sinon.assert.calledWithExactly(sendStub, 200);
});
