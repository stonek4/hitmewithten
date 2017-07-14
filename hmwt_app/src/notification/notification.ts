import {LogManager} from 'aurelia-framework';
import 'bootstrap-notify';

let logger = LogManager.getLogger('notification');

export class Notification {

  constructor() {
  }

  display(text: string) {
      logger.debug("displaying a notification");
      (<any>$).notify(text);
  }

}
