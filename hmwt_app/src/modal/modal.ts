import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Modal {
  constructor(public eventAggregator: EventAggregator){ }

  close(){
    (<HTMLElement>document.querySelector('.modal')).style.display = "none";
    this.eventAggregator.publish("modal-closed", {});
  }
}
