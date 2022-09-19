import { Aurelia, LogManager } from 'aurelia-framework';
import environment from './environment';
import { ConsoleLogger } from './console-logger';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

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

  aurelia.start()
  .then(() => {
      setTimeout(() => {
          aurelia.setRoot('app/app')
          .then(() => {
            console.log("Initializing firebase");
            // Your web app's Firebase configuration
            // For Firebase JS SDK v7.20.0 and later, measurementId is optional
            const firebaseConfig = {
              apiKey: "AIzaSyDBq_wLErSyKvKyb5j_fIC6Yw7S0dryxUw",
              authDomain: "vocards-62df8.firebaseapp.com",
              databaseURL: "https://vocards-62df8.firebaseio.com",
              projectId: "vocards-62df8",
              storageBucket: "vocards-62df8.appspot.com",
              messagingSenderId: "997127268774",
              appId: "1:997127268774:web:2fe4d338fada310b368767",
              measurementId: "G-GZG1SK5K0V"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            getAnalytics(app);
            return;
          })
          .catch((reason) => {
            console.error(reason);
          });
      });
  })
  .catch((reason) => {
    console.error(reason);
  });
}
