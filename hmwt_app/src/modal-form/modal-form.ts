import { bindable, bindingMode, inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Modal } from '../modal/modal';

@inject(EventAggregator)
export class ModalForm extends Modal {

  @bindable ({defaultBindingMode: bindingMode.twoWay}) value: string = "";

  public attached() {
    (<HTMLElement>document.querySelector('.modal-form-input')).focus();
  }

  public closeForm() {
    if (this.value !== "") {
        this.close();
    }
  }
}
