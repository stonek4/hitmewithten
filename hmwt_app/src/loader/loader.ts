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
    this.animator.animate(document.querySelector('.loader-upload'), 'flipInX');
    this.animator.animate(document.querySelector('.loader-back'), 'flipInX');
  }

  exitAnimations(){
    this.animator.animate(document.querySelector('.list-group'), 'slideOutLeft');
    this.animator.animate(document.querySelector('.loader-create'), 'flipOutX');
    this.animator.animate(document.querySelector('.loader-upload'), 'flipOutX');
    this.animator.animate(document.querySelector('.loader-back'), 'flipOutX');
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
    (<HTMLElement>document.querySelector('modal-menu')).style.display = 'none';
    this.enterAnimations();
  }

  showModal(aset: CardSet){
    this.currentSet = aset;
    this.eventAggregator.subscribeOnce('modal-action', (action) => {
      this.action = action;
    });
    this.eventAggregator.subscribeOnce('modal-closed', () => {
      console.log(this.action)
      if (this.action == "load"){
        this.load();
      }
      else if (this.action == "edit"){
        this.edit();
      }
      else if (this.action == "delete"){
        this.delete();
      }
    });
    (<HTMLElement>document.querySelector('modal-menu')).style.display = 'block';
  }

  load(){
    this.storage.setItem('current', this.currentSet.name);
    this.navigateTo('Menu');
  }

  back(){
    this.router.navigateBack();
  }

  edit(){
    this.navigateTo('Creator');
    return;
  }

  delete(){
    this.storage.removeItem(this.currentSet.name);
    var keys = JSON.parse(this.storage.getItem('keys'));
    keys.splice(keys.indexOf(this.currentSet.name), 1);
    this.storage.setItem("keys", JSON.stringify(keys));
    window.location.reload();
    if (this.currentSet.name = this.storage.getItem('current')){
      this.storage.setItem('current', null);
    }
  }

  create(){
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      this.storage.setItem("keys", JSON.stringify([]))
    }
    this.currentSet = {name: "", number:0};
    this.navigateTo('Creator');
  }
}
