import { IScopedHttpClient, IHttpResponse } from 'hubot';

export interface IBuildResponse {
  accountName: string;
  projectSlug: string;
  version: string;
  link: string;
}

export interface IDeployResponse {
  link: string;
}

export interface IAppVeyor {
  build(http: (url: string) => IScopedHttpClient, projectSlug: string): Promise<IBuildResponse>;
  deploy(http: (url: string) => IScopedHttpClient, projectSlug: string, version: string, environment: string): Promise<IDeployResponse>;
}

export class AppVeyor implements IAppVeyor {
  constructor(private token: string, private accountName: string) { }

  public build(http, projectSlug) {
    const body = JSON.stringify({
      accountName: this.accountName,
      projectSlug: projectSlug
    });

    return new Promise<IBuildResponse>((resolve, reject) => {
      this.post(http, 'https://ci.appveyor.com/api/builds', body, (err, resp, data) => {
        if (err) reject(err);
        if (resp.statusCode !== 200) reject(new Error(`Got an unexpected status code: ${resp.statusCode}`));

        const o = JSON.parse(data);

        resolve({
          accountName: this.accountName,
          projectSlug: projectSlug,
          version: o.version,
          link: `https://ci.appveyor.com/project/${this.accountName}/${projectSlug}/build/${o.version}`
        });
      });
    });
  }

  public deploy(http, projectSlug, version, environment) {
    const body = JSON.stringify({
      environmentName: environment,
      accountName: this.accountName,
      projectSlug: projectSlug,
      buildVersion: version
    });

    return new Promise<IDeployResponse>((resolve, reject) => {
      this.post(http, 'https://ci.appveyor.com/api/deployments', body, (err, resp, data) => {
        if (err) reject(err);
        if (resp.statusCode !== 200) reject(new Error(`Got an unexpected status code: ${resp.statusCode}`));

        const o = JSON.parse(data);

        resolve({
          link: `https://ci.appveyor.com/project/${this.accountName}/${projectSlug}/deployment/${o.deploymentId}`
        });
      });
    });
  }

  private post(http: (url: string) => IScopedHttpClient, url: string, body: string, callback: (err: Error, resp: IHttpResponse, data: string) => void) {
    http(url)
      .header('Authorization', `Bearer ${this.token}`)
      .header('Content-Type', 'application/json')
      .header('Accept', 'application/json')
      .post(body)(callback);
  }
}