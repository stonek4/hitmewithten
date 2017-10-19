import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Modal {
  protected eventAggregator: EventAggregator;

  constructor(eventAggregator: EventAggregator) {
      this.eventAggregator = eventAggregator;
  }

  protected close() {
    (<HTMLElement>document.querySelector('.modal')).style.display = "none";
    this.eventAggregator.publish("modal-closed", {});
  }
}
