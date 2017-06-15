import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';
import {EventAggregator} from 'aurelia-event-aggregator';

interface CardSet{
  name: string;
  number: number;
}

@inject(Router, CssAnimator, EventAggregator)
export class Menu {

  sets: CardSet[] = [];
  storage = window.localStorage;
  action: string;
  currentSet: CardSet;

  constructor(private router: Router, private animator: CssAnimator, private eventAggregator: EventAggregator){
  }

  enterAnimations(){
    this.animator.animate(document.querySelector('.about-text-container'), 'slideInRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipInX');
  }

  exitAnimations(){
    this.animator.animate(document.querySelector('.about-text-container'), 'slidOutRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipOutX');
  }

  attached(){
    this.enterAnimations();
  }

  back(){
    this.exitAnimations();
    this.router.navigateBack();
  }
}
