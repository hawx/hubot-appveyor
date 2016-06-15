import { IRobot } from 'hubot';
import { ISlackAdapter, ICustomMessage } from 'hubot-slack';
import { Config } from '../lib/config';
import { IAppVeyor } from '../lib/appveyor';

export default (robot: IRobot, appveyor: IAppVeyor) => {

  robot.respond(/deploy (.+) v(.+) to (.+)/i, res => {
    const project = res.match[1];
    const version = res.match[2];
    const environment = res.match[3];

    res.reply(`Starting deploy of '${project}' to '${environment}'...`);

    appveyor.deploy(robot.http, project, version, environment)
      .then((data) => {
        let msgData: ICustomMessage = {
          channel: res.message.room,
          text: 'Deploy started',
          attachments: [
            {
              fallback: `Started deploy of '${project}' v${version} to '${environment}': ${data.link}`,
              title: `Started deploy of '${project}' v${version}`,
              title_link: data.link,
              text: `v${version}`,
              color: '#2795b6'
            }
          ]
        };

        const slackAdapter = robot.adapter as ISlackAdapter;
        slackAdapter.customMessage(msgData);
      })
      .catch(res.reply);
  });
}