import {bindable, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Modal} from '../modal/modal'

@inject(EventAggregator)
export class ModalAlert extends Modal{

  attached(){
  }

  closeForm(){
    this.close();
  }
}
