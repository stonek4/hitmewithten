import {inject, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';
import {EventAggregator} from 'aurelia-event-aggregator';

let logger = LogManager.getLogger('about');

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
    logger.debug('constructing the about class');
  }

  enterAnimations(){
    logger.debug('performing entrance animations');
    this.animator.animate(document.querySelector('.about-text-container'), 'slideInRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipInX');
  }

  exitAnimations(){
    logger.debug('performing exit animations');
    this.animator.animate(document.querySelector('.about-text-container'), 'slidOutRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipOutX');
  }

  attached(){
    logger.debug('attaching the about');
    this.enterAnimations();
  }

  back(){
    logger.debug('navigating back');
    this.exitAnimations();
    this.router.navigateBack();
  }
}
