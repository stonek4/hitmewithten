import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

@inject(Router)
export class Tester {

  definition: string;

  constructor(private router: Router){
    this.definition = "TEST";
  }

  activate(params, routeData){
    //var info = routeData.settings;

  }
}
