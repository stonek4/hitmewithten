import {bindable, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Modal} from '../modal/modal'

@inject(EventAggregator)
export class ModalMenu extends Modal{

  @bindable ({defaultBindingMode: bindingMode.twoWay}) value: string = "";

  attached(){
  }

  closeForm(){
    if (this.value != ""){
        this.close();
    }
  }
}
