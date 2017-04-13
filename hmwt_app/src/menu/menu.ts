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
      this.cards = JSON.parse(this.storage.getItem(this.name+".cards"));
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
      this.router.routes.find(x => x.name === "Tester").settings = info;
      this.router.navigateToRoute('Tester', { id:this.name});
    }
  }

  load(){
    var keys = this.storage.getItem("keys");
      this.router.navigateToRoute('Loader');
  }

  settings(){
    var keys = this.storage.getItem("settings");
    if (keys === null || keys == ""){
      this.storage.setItem("settings", JSON.stringify([]));
    }
  }

  about(){
    this.router.navigateToRoute('About');
  }
}
