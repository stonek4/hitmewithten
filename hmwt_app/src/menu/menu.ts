import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Card } from '../card';
import { CssAnimator } from 'aurelia-animator-css';
import { Trophies } from '../trophies/trophies';
import { Globals } from '../globals';

const logger = LogManager.getLogger('menu');

@inject(Router, CssAnimator, Trophies, Globals)
export class Menu {

  /** List of cards */
  // tslint:disable-next-line:no-null-keyword
  cards: Card[] = null;
  /** The name of the cards */
  name: string = "";
  /** The localstorage */
  storage: Storage = window.localStorage;
  /** The modal text */
  modalText: string = "";

  private router: Router;
  private animator: CssAnimator;
  private trophies: Trophies;
  private globals: Globals;

  public constructor(router: Router, animator: CssAnimator, trophies: Trophies, globals: Globals) {
    logger.debug("constructing the menu class");
    this.name = this.storage.getItem("current");
    this.animator = animator;
    this.trophies = trophies;
    this.router = router;
    this.globals = globals;

    this.trophies.initializeTrophies();
    // tslint:disable-next-line:no-null-keyword
    if (this.name != null) {
      logger.debug("current set of cards detected");
      this.cards = JSON.parse(this.storage.getItem(this.name + ".cards"));
    } else {
      logger.debug("current set of cards undetected");
    }
  }

  public attached() {
    logger.debug("attaching the menu");
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
    logger.debug("performing entrance animations");
    return this.globals.performEntranceAnimations('menu-btn-cont', 'flipInX');
  }

  private navigateTo(location: string) {
    logger.debug("navigating to " + location);

    this.globals.performExitAnimations('menu-btn-cont', 'flipOutX').then(() => {
        if (location === "Tester") {
          this.router.navigateToRoute(location, { id: this.name });
        }
        else {
          this.router.navigateToRoute(location);
        }
    }).catch(() => {
        this.router.navigateToRoute(location);
    });
  }

  public serve(num: number) {
    logger.debug("attempting to serve cards");
    // tslint:disable-next-line:no-null-keyword
    if (this.cards == null || 0 > this.cards.length) {
      logger.warn("no card set detected");
      this.modalText = " You have no selected card set, go to 'Manage Cards' to create/select one!";
      (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
      return;
    } else {
      logger.debug("card set detected");
      let info;
      if (num > 0) {
        logger.debug("limiting number of cards to " + num.toString());
        info = this.cards
        .sort(() => { return 0.5 - Math.random(); })
        .slice(0, num);
      } else {
        logger.debug("not limiting cards");
        info = this.cards.sort(() => { return 0.5 - Math.random(); });
      }
      this.router.routes.find((x) => x.name === "Tester").settings = info;
      this.navigateTo("Tester");
    }

  }

  public load() {
    // let keys = this.storage.getItem("keys");
    this.navigateTo('Loader');
  }

  public settings() {
    this.modalText = `Currently there are no settings available to change.
    If you have an idea for a setting, please email info@vocabcards.com`;
    (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
    return;
    //let keys = this.storage.getItem("settings");
    //if (keys === null || keys == ""){
    //  this.storage.setItem("settings", JSON.stringify([]));
    //}
  }

  public about() {
    this.navigateTo('About');
  }
}
