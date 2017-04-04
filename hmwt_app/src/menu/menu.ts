import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  definitions: string[];
  answers: string[];
}

@inject(Router)
export class Menu {

  cards : Card[] = [];
  name: string = "";
  storage: Storage = window.localStorage;

  constructor(private router: Router){
    this.name = this.storage.getItem("current");
    if (this.name != null){
      this.cards = JSON.parse(this.storage.getItem(this.name));
    }
  }

  serve(number:any){
    if (this.name !== ""){
      if (number > 0){
        var info = this.cards
        .sort(function() { return 0.5 - Math.random() })
        .slice(0, number);
      } else {
        var info = this.cards.sort(function() { return 0.5 - Math.random() })
      }
      this.router.navigateToRoute('Tester', { id:this.name});
    }
  }

  load(){
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      window.alert("No cards found, please create some!")
      this.create();
    }
    else {
      this.router.navigateToRoute('Loader');
    }
  }

  create(){
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      this.storage.setItem("keys", JSON.stringify([]))
    }
    this.router.navigateToRoute('Creator');
  }

  about(){
    this.router.navigateToRoute('About');
  }
}
