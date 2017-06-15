import {bindable, bindingMode, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Card} from '../card'
import {CssAnimator} from 'aurelia-animator-css';

@inject(Router, CssAnimator)
export class Menu {
  cards : Card[] = null;
  name: string = "";
  storage: Storage = window.localStorage;
  modalText: string = "";

  constructor(private router: Router, private animator: CssAnimator){
    this.name = this.storage.getItem("current");
    this.animator = animator;
    if (this.name != null){
      this.cards = JSON.parse(this.storage.getItem(this.name+".cards"));
    }
  }

  attached(){
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
    this.enterAnimations();
  }

  enterAnimations(){
    let elements = document.getElementsByClassName('menu-btn-cont');
    for(var i = 0; i < elements.length; i++){
      this.animator.animate(elements[i], 'flipInX');
    }
  }

  exitAnimations(){
    let elements = document.getElementsByClassName('menu-btn-cont');
    for(var i = 0; i < elements.length; i++){
      this.animator.animate(elements[i], 'flipOutX');
    }
  }

  navigateTo(location:string){
    this.exitAnimations();
    setTimeout( () => {
      if (location == "Tester"){
        this.router.navigateToRoute(location, { id:this.name});
      }
      else{
        this.router.navigateToRoute(location)
      }
    }, 300);
  }

  serve(number:any){
    if (this.cards == null || 0 > this.cards.length){
      this.modalText = " You have no selected card set, go to 'Manage Cards' to create/select one!";
      (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
      return;
    } else {
      if (number > 0){
        var info = this.cards
        .sort(function() { return 0.5 - Math.random() })
        .slice(0, number);
      } else {
        var info = this.cards.sort(function() { return 0.5 - Math.random() })
      }
      this.router.routes.find(x => x.name === "Tester").settings = info;
      this.navigateTo("Tester");
    }
  }

  load(){
    var keys = this.storage.getItem("keys");
      this.navigateTo('Loader');
  }

  settings(){
    this.modalText = " Currently there are no settings available to change.";
    (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
    return;
    //var keys = this.storage.getItem("settings");
    //if (keys === null || keys == ""){
    //  this.storage.setItem("settings", JSON.stringify([]));
    //}
  }

  about(){
    this.navigateTo('About');
  }
}
