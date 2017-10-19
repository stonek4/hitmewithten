import { LogManager } from 'aurelia-framework';
// tslint:disable-next-line:no-import-side-effect
import 'bootstrap-notify';

const logger = LogManager.getLogger('notification');

export class Notification {

  public constructor() {
  }

  public display(text: string, title: string) {
    logger.debug("displaying a notification");
    (<any>$).notify({
      title: title,
      message: text,
      icon: 'glyphicon glyphicon-gift'
    }, {
      type: 'minimalist',
      delay: 2000,
      template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
          '<div data-notify="icon" class="img-circle pull-left"></div>' +
          // tslint:disable-next-line:indent
	      '<span data-notify="title">{1}</span>' +
          // tslint:disable-next-line:indent
	      '<span data-notify="message">{2}</span>' +
          // tslint:disable-next-line:indent
	      '</div>'
    });
  }
}
