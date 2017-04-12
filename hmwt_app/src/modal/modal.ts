import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

@inject(Router)
export class Modal {

  constructor(private router: Router){
  }
}
