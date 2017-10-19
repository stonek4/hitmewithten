import { Aurelia, LogManager } from 'aurelia-framework';
import environment from './environment';
import { ConsoleLogger } from './console-logger';

//Configure Bluebird Promises.
//Note: You may want to use environment-specific configuration.
(<any>Promise).config({
  warnings: {
    wForgottenReturn: false
  }
});

LogManager.addAppender(new ConsoleLogger());

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources');

  aurelia.use.plugin('aurelia-animator-css');

  if (environment.debug) {
    LogManager.setLevel(LogManager.logLevel.debug);
  } else {
    LogManager.setLevel(LogManager.logLevel.error);
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => {
      setTimeout(() => {
          aurelia.setRoot('app/app');
      });
  });
}
