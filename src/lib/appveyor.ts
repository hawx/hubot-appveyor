import { IScopedHttpClient, IHttpResponse } from 'hubot';

export interface IBuildResponse {
  accountName: string;
  projectSlug: string;
  version: string;
  link: string;
}

export interface IAppVeyor {
  build(http: (url: string) => IScopedHttpClient, projectSlug: string): Promise<IBuildResponse>;
}

export class AppVeyor implements IAppVeyor {
  static URL = 'https://ci.appveyor.com/api/builds';

  constructor(private token: string, private accountName: string) { }

  public build(http, projectSlug) {
    const body = JSON.stringify({
      accountName: this.accountName,
      projectSlug: projectSlug
    });

    return new Promise<IBuildResponse>((resolve, reject) => {
      this.post(http, body, (err, resp, data) => {
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

  private post(http: (url: string) => IScopedHttpClient, body: string, callback: (err: Error, resp: IHttpResponse, data: string) => void) {
    http(AppVeyor.URL)
      .header('Authorization', `Bearer ${this.token}`)
      .header('Content-Type', 'application/json')
      .header('Accept', 'application/json')
      .post(body)(callback);
  }
}