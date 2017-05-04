import {bindable, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Modal} from '../modal/modal'

@inject(EventAggregator)
export class ModalForm extends Modal{

  @bindable ({defaultBindingMode: bindingMode.twoWay}) value: string = "";

  attached(){
    (<HTMLElement>document.querySelector('.modal-form-input')).focus();
  }

  closeForm(){
    if (this.value != ""){
        this.close();
    }
  }
}
