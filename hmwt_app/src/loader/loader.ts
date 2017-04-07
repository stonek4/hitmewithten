import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface CardSet{
  name: string;
  number: number;
}

@inject(Router)
export class Menu {

  sets: CardSet[] = [];
  storage = window.localStorage;

  constructor(private router: Router){
    let keys = JSON.parse(this.storage.getItem('keys'));
    for(let i = 0; i < keys.length; i++){
      let nums = JSON.parse(this.storage.getItem(keys[i])).length;
      this.sets.push({name:keys[i], number: nums});
    }
    console.log(this.sets)
  }

  load(aset: CardSet){
    this.storage.setItem('current', aset.name);
    this.router.navigateToRoute('Menu');
  }
}
