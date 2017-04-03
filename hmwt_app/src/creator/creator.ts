import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  definition: string;
  answers: string[];
}

@inject(Router)
export class Creator {

  cards: Card[] = [];
  definition: string;
  answer: string;
  index: number;

  constructor(private router: Router){
    this.index = 0;
  }

  next(){
    Card card = {definition: this.definition; answer: this.answer};
    if (cards.length < index + 1){
      cards.append(card);
      this.definition = "";
      this.answer = "";
    }
    else{
      cards[index] = card;
      if (cards.length === index + 1){
        this.definition = "";
        this.answer = "";
      }
      else{
        this.definition = cards[index+1].definition;
        this.answer = cards[index+1].definition;
      }
    }
    index += 1;
  }

  back(){
    if (index != 0){

    }
  }
}
