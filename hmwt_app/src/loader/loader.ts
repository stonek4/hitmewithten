import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';

interface CardSet{
  name: string;
  number: number;
}

@inject(Router, CssAnimator)
export class Menu {

  sets: CardSet[] = [];
  storage = window.localStorage;
  action: string;

  constructor(private router: Router, private animator: CssAnimator){
    this.animator = animator;
    let keys = JSON.parse(this.storage.getItem('keys'));
    if (keys != null){
      for(let i = 0; i < keys.length; i++){
        let nums = JSON.parse(this.storage.getItem(keys[i]+".cards")).length;
        this.sets.push({name:keys[i], number: nums});
      }
    }
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
      this.router.navigateToRoute(location);
    }, 400);
  }

  attached(){
    this.enterAnimations();
  }

  load(aset: CardSet){
    this.storage.setItem('current', aset.name);
    this.navigateTo('Menu');
  }

  create(){
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      this.storage.setItem("keys", JSON.stringify([]))
    }
    this.navigateTo('Creator');
  }
}
