import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  definition: string;
  answers: string[];
}

@inject(Router)
export class Menu {

  constructor(private router: Router){}

  cards : Card[] = [];
  card_name: string = "";

  serve(number:any){
    if (this.card_name !== ""){
      var info = this.getRandomSubarray(this.cards, number);
      this.router.routes.find(x => x.name === "Tester").settings = info;
      this.router.navigateToRoute('Tester', { id:this.card_name});
    }
  }

  load(){
    var storage = window.localStorage;
    var keys = storage.getItem("keys");
    if (keys === null || keys == ""{
      storage.setItem("keys", "")
      window.alert("No cards found, please create some!")
      this.create();
    }
    else {
      this.router.navigateToRoute('Loader');
    }
  }

  create(){
    this.router.navigateToRoute('Creator');
  }

  about(){
    this.router.navigateToRoute('About');
  }

  getRandomSubarray(arr:any, size:any) {
    var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
  }
}
