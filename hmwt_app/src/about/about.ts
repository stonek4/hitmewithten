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
    this.animator.animate(document.querySelector('.list-group'), 'slideInLeft');
    this.animator.animate(document.querySelector('.loader-create'), 'flipInX');
  }

  exitAnimations(){
    this.animator.animate(document.querySelector('.list-group'), 'slideOutLeft');
    this.animator.animate(document.querySelector('.loader-create'), 'flipOutX');
  }

  navigateTo(location:string){
    this.exitAnimations();
    setTimeout(() => {
      if (location == "Menu"){
        this.router.navigateBack();
      } else if (this.currentSet.name == ''){
          this.router.navigateToRoute(location);
      } else {
          this.router.navigateToRoute(location, {id:this.currentSet.name});
      }
    }, 300);
  }

  attached(){
  }
}
