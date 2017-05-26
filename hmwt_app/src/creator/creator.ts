import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {Card} from '../card';
import {CssAnimator} from 'aurelia-animator-css';

@inject(Router, EventAggregator, CssAnimator)
export class Creator {

  cards: Card[] = [];
  definition: string = "";
  answer: string = "";
  index: number;
  name: string;

  constructor(private router: Router, private eventAggregator: EventAggregator, private animator: CssAnimator){
    this.index = 0;
    this.animator = animator;
  }

  activate(params, routeData){
    if (params.id != null) {
      this.index = -1;
      this.cards = JSON.parse(window.localStorage.getItem(params.id+".cards"));
      this.name = params.id;
    } else {
      this.eventAggregator.subscribeOnce('modal-closed', payload => {
        console.log(this.name);
        (<HTMLElement>document.querySelector('.creator-definition')).focus();
      });
    }
  }

  attached(){
    if (this.index == -1){
      (<HTMLElement>document.querySelector('modal-form')).style.display = 'none';
      (<HTMLElement>document.querySelector('.creator-definition')).focus();
      this.back();
    }
    this.enterAnimations();
  }

  enterAnimations(){
    this.animator.animate(document.querySelector('.creator'), 'slideInLeft');
  }

  exitAnimations(){
    this.animator.animate(document.querySelector('.list-group'), 'slideOutLeft');
  }

  next(){
    if (this.definition == ""){
      (<HTMLElement>document.querySelector(".creator-definition")).focus();
      return;
    }
    if ( this.answer == ""){
      (<HTMLElement>document.querySelector(".creator-answer")).focus();
      return;
    }
    let card: Card = {definitions: [this.definition], answers: [this.answer]};
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
        this.definition = this.cards[this.index+1].definitions[0];
        this.answer = this.cards[this.index+1].answers[0];
      }
    }
    this.index += 1;
    (<HTMLElement>document.querySelector(".creator-definition")).focus();
  }

  back(){
    if (this.index > 0){
      this.definition = this.cards[this.index-1].definitions[0];
      this.answer = this.cards[this.index-1].answers[0];
      this.index -= 1;
    } else{
      this.index = 0;
      if (this.cards.length > 0){
        this.definition = this.cards[this.index].definitions[0];
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
    if (this.definition != "" && this.answer != ""){
      this.next();
    }
    var storage = window.localStorage;
    storage.setItem(this.name + ".cards", JSON.stringify(this.cards));
    var keys = JSON.parse(storage.getItem('keys'));
    if (keys.indexOf(this.name) === -1){
      keys.push(this.name);
    }
    storage.setItem('keys', JSON.stringify(keys));
    storage.setItem('current', this.name);
    this.exitAnimations();
    setTimeout(() => {
      this.router.navigateBack();
    }, 300);
  }
}
