import {LogManager} from 'aurelia-framework';
import 'bootstrap-notify';

let logger = LogManager.getLogger('notification');

export class Notification {

  constructor() {
  }

  display(text: string, title: string) {
      logger.debug("displaying a notification");
      (<any>$).notify({
          title: title,
          message: text,
          icon: 'glyphicon glyphicon-gift'
      }, {
        	type: 'minimalist',
        	delay: 3000,
            template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
		              '<div data-notify="icon" class="img-circle pull-left"></div>' +
		              '<span data-notify="title">{1}</span>' +
		              '<span data-notify="message">{2}</span>' +
	                  '</div>'
      });
  }
}
