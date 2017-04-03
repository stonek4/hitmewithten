import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  text: string;
  definitions: string[];
}

@inject(Router)
export class Menu {

  constructor(private router: Router){}

  cards : Card[] = [];
  card_name: string = "";

  serve(number:any){
    if (this.card_name !== ""){
      var info = this.getRandomSubarray(this.cards, number);
      this.router.routes.find(x => x.name === "Test").settings = info;
      this.router.navigateToRoute('Test', { id:this.card_name});
    }
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
