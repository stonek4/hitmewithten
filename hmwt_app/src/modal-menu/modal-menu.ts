import {bindable, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Modal} from '../modal/modal'

@inject(EventAggregator)
export class ModalMenu extends Modal{

  // FIXME: Why doesn't this work???
  @bindable ({defaultBindingMode: bindingMode.twoWay}) action: string = "";

  attached(){
  }

  closeForm(){
    this.eventAggregator.publish('modal-action', this.action);
    if (this.action != ""){
        this.close();
    }
  }

  load(){
    this.action = "load";
    this.closeForm();
  }

  delete(){
    this.action = "delete";
    this.closeForm();
  }

  edit(){
    this.action = "edit";
    this.closeForm();
  }

  export(){
    this.action = "export";
    this.closeForm();
  }
}
