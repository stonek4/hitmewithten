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
    if (keys != null){
      for(let i = 0; i < keys.length; i++){
        let nums = JSON.parse(this.storage.getItem(keys[i]+".cards")).length;
        this.sets.push({name:keys[i], number: nums});
      }
    }
  }

  load(aset: CardSet){
    this.storage.setItem('current', aset.name);
    this.router.navigateToRoute('Menu');
  }

  create(){
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      this.storage.setItem("keys", JSON.stringify([]))
    }
    this.router.navigateToRoute('Creator');
  }
}
