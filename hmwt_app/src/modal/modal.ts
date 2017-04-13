import {bindable, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class Modal {

  @bindable ({defaultBindingMode: bindingMode.twoWay}) value: string = "";

  constructor(private eventAggregator: EventAggregator){ }

  attached(){
    (<HTMLElement>document.querySelector('.modal-input')).focus();
  }

  close(){
    if (this.value != ""){
        (<HTMLElement>document.querySelector('.modal')).style.display = "none";
    }
    this.eventAggregator.publish("modal-closed", {});
  }
}
