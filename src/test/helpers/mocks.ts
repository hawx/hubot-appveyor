import { IRobot, IAdapter, IRobotBrain, IListener, IResponse, IMessageDetail, IScopedHttpClient, IHttpResponse, IHttpClientHandler } from 'hubot';
import { ISlackAdapter, ICustomMessage } from 'hubot-slack';
import { Application } from 'express';
import { IAppVeyor, IBuildResponse, IDeployResponse } from '../../lib/appveyor';

export class MockRobot implements IRobot {
  public adapter: IAdapter;
  public brain: IRobotBrain;
  public router: Application;

  public respond(matcher: RegExp, listener: IListener) { }
  public http(url: string) { return null; }
  public messageRoom(room: string, msg: string) { }
}

export class MockResponse implements IResponse {
  public match: string[];
  public message: IMessageDetail;

  public reply(msg: string) { }
}

export class MockScopedHttpClient implements IScopedHttpClient {
  public header(name: string, value: string) {
    return this;
  }

  public post(body: string) {
    return (handler: IHttpClientHandler) => {
      handler(null, { statusCode: 200 }, '');
    };
  }
}

export class MockSlackAdapter implements ISlackAdapter {
  public customMessage(msg: ICustomMessage) { return null; }
}

export class MockRobotBrain implements IRobotBrain {
  public get(key: string) { return null; }
  public set(key: string, value: string) { }
}

export class MockAppVeyor implements IAppVeyor {
  private buildResponse: IBuildResponse;

  static builds(returnValue: IBuildResponse) {
    let ret = new MockAppVeyor();
    ret.buildResponse = returnValue;
    return ret;
  }

  public build(http, projectSlug) {
    return Promise.resolve(this.buildResponse);
  }

  public deploy(http, projectSlug, version, environment) {
    return null;
  }
}