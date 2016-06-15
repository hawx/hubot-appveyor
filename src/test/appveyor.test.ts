import { test } from 'ava';
import * as sinon from 'sinon';

import { MockRobot, MockRobotBrain, MockResponse, MockScopedHttpClient, MockSlackAdapter } from './helpers/mocks';
import { IHttpClientHandler } from 'hubot';
import { ICustomMessage } from 'hubot-slack';
import * as express from 'express';
import { Config } from '../lib/config';
import { AppVeyor } from '../lib/appveyor';
import BuildScript from '../scripts/build';

test.cb('appveyor > build', (t) => {
  const token = 'my-token';
  const account = 'my-account';
  const project = 'my-project';
  const response = {
    "buildId": 136709,
    "jobs": [],
    "buildNumber": 7,
    "version": "1.0.7",
    "message": "replaced with command [skip ci]",
    "branch": "master",
    "commitId": "c2892a70d60c96c1b65a7c665ab806b7731fea8a",
    "authorName": "Feodor Fitsner",
    "authorUsername": "FeodorFitsner",
    "committerName": "Feodor Fitsner",
    "committerUsername": "FeodorFitsner",
    "committed": "2014-08-15T22:05:54+00:00",
    "messages": [],
    "status": "queued",
    "created": "2014-08-16T00:40:38.1703914+00:00"
  };

  const appveyor = new AppVeyor(token, account);

  const httpClient = new MockScopedHttpClient();

  const headerSpy = sinon.spy(httpClient, 'header');

  const postStub = sinon.stub(httpClient, 'post');
  postStub.returns((handler: IHttpClientHandler) => {
    handler(null, { statusCode: 200 }, JSON.stringify(response));
  });

  const httpStub = sinon.stub().returns(httpClient);

  const result = appveyor.build(httpStub, project);

  t.true(httpStub.calledWith('https://ci.appveyor.com/api/builds'));
  t.true(headerSpy.calledWith('Authorization', `Bearer ${token}`));
  t.true(headerSpy.calledWith('Content-Type', 'application/json'));
  t.true(headerSpy.calledWith('Accept', 'application/json'));
  t.true(postStub.calledWith(`{"accountName":"${account}","projectSlug":"${project}"}`));

  result.then((data) => {
    t.is(data.accountName, account);
    t.is(data.projectSlug, project);
    t.is(data.version, response.version);
    t.is(data.link, `https://ci.appveyor.com/project/${account}/${project}/build/${response.version}`);

    t.end();
  }).catch(t.end);
});
