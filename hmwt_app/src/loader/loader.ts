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
  actionSub: any;
  closeSub: any;

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

  detached(){
    this.actionSub.dispose();
    this.closeSub.dispose();
  }

  attached(){
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
    this.enterAnimations();

    this.actionSub = this.eventAggregator.subscribe('modal-action', (action) => {
      this.action = action;
    });
    this.closeSub = this.eventAggregator.subscribe('modal-closed', () => {
      if (this.action == "load"){
        this.load();
      }
      else if (this.action == "edit"){
        this.edit();
      }
      else if (this.action == "delete"){
        this.delete();
      }
      else if (this.action == "export"){
        this.export();
      }
    });
  }

  showModal(aset: CardSet){
    this.currentSet = aset;
    (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
  }

  load(){
    this.storage.setItem('current', this.currentSet.name+".cards");
    this.navigateTo('Menu');
  }

  upload(){

  }

  export(){
    var exportData = this.storage.getItem(this.currentSet.name+".cards");
    var element = document.createElement('a');
    element.setAttribute('href', 'data:charset=utf-8,'
      + encodeURIComponent(exportData));
    element.setAttribute('download', this.currentSet.name+".cards");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  back(){
    this.router.navigateBack();
  }

  edit(){
    this.navigateTo('Creator');
    return;
  }

  delete(){
    this.storage.removeItem(this.currentSet.name+".cards");
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
