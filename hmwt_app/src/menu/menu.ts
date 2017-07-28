import {bindable, bindingMode, inject, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Card} from '../card'
import {CssAnimator} from 'aurelia-animator-css';
import {Trophies} from '../trophies/trophies';

let logger = LogManager.getLogger('menu');

@inject(Router, CssAnimator, Trophies)
export class Menu {
  cards : Card[] = null;
  name: string = "";
  storage: Storage = window.localStorage;
  modalText: string = "";

  constructor(private router: Router, private animator: CssAnimator, private trophies: Trophies){
    logger.debug("constructing the menu class");

    this.name = this.storage.getItem("current");
    this.animator = animator;
    this.trophies = trophies;

    this.trophies.initializeTrophies();

    if (this.name != null){
      logger.debug("current set of cards detected");
      this.cards = JSON.parse(this.storage.getItem(this.name+".cards"));
    } else {
      logger.debug("current set of cards undetected");
    }
  }

  attached(){
    logger.debug("attaching the menu");
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
    this.enterAnimations();
  }

  enterAnimations(){
    logger.debug("performing entrance animations");
    let elements = document.getElementsByClassName('menu-btn-cont');
    for(var i = 0; i < elements.length; i++){
      this.animator.animate(elements[i], 'flipInX');
    }
  }

  exitAnimations(){
    logger.debug("performing exit animations");
    let elements = document.getElementsByClassName('menu-btn-cont');
    for(var i = 0; i < elements.length; i++){
      this.animator.animate(elements[i], 'flipOutX');
    }
  }

  navigateTo(location:string){
    logger.debug("navigating to " + location);

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
    logger.debug("attempting to serve cards");

    if (this.cards == null || 0 > this.cards.length) {
      logger.warn("no card set detected");
      this.modalText = " You have no selected card set, go to 'Manage Cards' to create/select one!";
      (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
      return;
    } else {
      logger.debug("card set detected");
      if (number > 0) {
        logger.debug("limiting number of cards to " + number.toString());
        var info = this.cards
        .sort(function() { return 0.5 - Math.random() })
        .slice(0, number);
      } else {
        logger.debug("not limiting cards");
        var info = this.cards.sort(function() { return 0.5 - Math.random() })
      }
      this.router.routes.find(x => x.name === "Tester").settings = info;
      this.navigateTo("Tester");
    }

  }

  load() {
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
