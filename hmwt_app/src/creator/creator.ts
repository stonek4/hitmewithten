import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  definition: string[];
  answers: string[];
}

@inject(Router)
export class Creator {

  cards: Card[] = [];
  definition: string;
  answer: string;
  index: number;
  name: string;

  constructor(private router: Router){
    this.index = 0;
    this.name = prompt("Please enter a name for the card set.");
  }

  next(){
    let card: Card = {definition: [this.definition], answers: [this.answer]};
    if (this.cards.length < this.index + 1){
      this.cards.push(card);
      this.definition = "";
      this.answer = "";
    }
    else{
      this.cards[this.index] = card;
      if (this.cards.length === this.index + 1){
        this.definition = "";
        this.answer = "";
      }
      else{
        this.definition = this.cards[this.index+1].definition[0];
        this.answer = this.cards[this.index+1].answers[0];
      }
    }
    this.index += 1;
  }

  back(){
    if (this.index != 0){
      this.definition = this.cards[this.index-1].definition[0];
      this.answer = this.cards[this.index-1].answers[0];
      this.index -= 1;
    } else{
      if (this.cards.length > 0){
        this.definition = this.cards[this.index].definition[0];
        this.answer = this.cards[this.index].answers[0];
      }
      else{
        this.definition = "";
        this.answer = "";
      }
    }
  }

  delete(){
    if (this.cards.length > this.index){
      this.cards.splice(this.index, 1);
    }
    this.back();
  }

  done(){
    var storage = window.localStorage;
    storage.setItem(this.name, JSON.stringify(this.cards));
    this.router.navigateToRoute('/');
  }
}
