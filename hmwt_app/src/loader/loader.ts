import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { CssAnimator } from 'aurelia-animator-css';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Globals } from '../globals';

interface CardSet {
  name: string;
  number: number;
}

const logger = LogManager.getLogger("loader");

@inject(Router, CssAnimator, EventAggregator, Globals)
export class Menu {

  /** The sets of cards */
  sets: CardSet[] = [];
  /** Localstorage */
  storage = window.localStorage;
  /** What action was taken */
  action: string;
  /** The current set of cards */
  currentSet: CardSet;
  /** The subscription to the action event */
  actionSub: any;
  /** The subscription to the close event */
  closeSub: any;

  private router: Router;
  private animator: CssAnimator;
  private eventAggregator: EventAggregator;
  private globals: Globals;

  public constructor(router: Router, animator: CssAnimator, eventAggregator: EventAggregator, globals: Globals) {
    logger.debug("constructing the logger class");
    this.animator = animator;
    this.router = router;
    this.eventAggregator = eventAggregator;
    this.globals = globals;
    this.loadData();
  }

  private loadData() {
    logger.debug("loading the card list to display");

    const keys = JSON.parse(this.storage.getItem('keys'));
    // tslint:disable-next-line:no-null-keyword
    if (keys !== null) {
      for (let i = 0; i < keys.length; i++) {
        const nums = JSON.parse(this.storage.getItem(<string>keys[i] + ".cards")).length;
        this.sets.push({ name: keys[i], number: nums });
      }
    }
  }

  private navigateTo(location: string) {
    logger.debug("navigating to " + location);

    const promises = new Array<Promise<any>>();
    promises.push(this.globals.performExitAnimations('list-group', 'slideOutLeft'));
    promises.push(this.globals.performExitAnimations('list-flip', 'flipOutX'));

    Promise.all(promises).then(() => {
        if (location === 'Menu') {
            this.router.history.navigateBack();
        } else if (this.currentSet.name === '') {
            this.router.navigateToRoute(location);
        } else {
            this.router.navigateToRoute(location, { id: this.currentSet.name });
        }
    }).catch(() => {
        logger.error('An error occurred while navigating away');
        this.router.navigateToRoute('Menu');
    });
  }

  public detached() {
    logger.debug("detaching the loader");
    this.actionSub.dispose();
    this.closeSub.dispose();
  }

  public attached() {
    logger.debug("attaching the loader");
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';

    this.actionSub = this.eventAggregator.subscribe('modal-action', (action) => {
      logger.debug("the action was changed to " + <string>action);
      this.action = action;
    });

    this.closeSub = this.eventAggregator.subscribe('modal-closed', () => {
      if (this.action === "load") {
        this.load();
      }
      else if (this.action === "edit") {
        this.edit();
      }
      else if (this.action === "delete") {
        this.delete();
      }
      else if (this.action === "export") {
        this.export();
      }
    });

    const promises = new Array<Promise<any>>();
    promises.push(this.globals.performEntranceAnimations('list-group', 'slideInLeft'));
    promises.push(this.globals.performEntranceAnimations('loader-flip', 'flipInX'));
    return Promise.all(promises);
  }

  public showModal(aset: CardSet) {
    logger.debug("showing the modal menu");
    this.currentSet = aset;
    (<HTMLElement>document.querySelector('.modal')).style.display = 'block';
  }

  public load() {
    logger.debug("changing the current card set to " + this.currentSet.name);
    this.storage.setItem('current', this.currentSet.name);
    this.back();
  }

  public upload() {
    logger.debug("prompting the user for a file");
    const loader = document.getElementById('loader-file');
    loader.click();
    loader.addEventListener('change', (event) => { this.import(event); }, false);
  }

  public import(event) {
    logger.debug("parsing the files that the user uploaded");
    const storage = window.localStorage;
    const reader = new FileReader();
    const files = event.target.files;
    let f: any;

    for (let i = 0; i < files.length; i++) {

      logger.debug("parsing file " + i.toString());
      f = files[i];

      logger.debug("reading the file");
      reader.readAsText(f);

      if (f.name.indexOf(".cards") !== -1) {
        logger.debug("card set not found");
        const title: string = f.name.slice(0, -6);
        reader.onload = () => {

          logger.debug("card set is saving");
          if (title !== "") {
            const cards = reader.result;
            storage.setItem(title + ".cards", cards);
            const keys = JSON.parse(storage.getItem('keys'));
            if (keys.indexOf(title) === -1) {
              keys.push(title);
            }
            storage.setItem('keys', JSON.stringify(keys));
            logger.debug("card set has been saved");
          }
          this.sets = [];
          this.loadData();
        };
      }
    }
  }

  public export() {
    logger.debug("exporting the card set " + this.currentSet.name);
    const exportData = this.storage.getItem(this.currentSet.name + ".cards");
    const element = document.createElement('a');
    element.setAttribute('href', 'data:charset=utf-8,'
      + encodeURIComponent(exportData));
    element.setAttribute('download', this.currentSet.name + ".cards");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public back() {
    logger.debug("navigating back");
    this.navigateTo('Menu');
  }

  public edit() {
    this.navigateTo('Creator');
    return;
  }

  public delete() {
    logger.debug("removing the card set " + this.currentSet.name);
    this.storage.removeItem(this.currentSet.name + ".cards");
    const keys = JSON.parse(this.storage.getItem('keys'));
    keys.splice(keys.indexOf(this.currentSet.name), 1);
    this.storage.setItem("keys", JSON.stringify(keys));
    this.sets = [];
    this.loadData();
    if (this.currentSet.name === this.storage.getItem('current')) {
      // tslint:disable-next-line:no-null-keyword
      this.storage.setItem('current', null);
    }
  }

  public create() {
    logger.debug("user requested to create a new card set");
    const keys = this.storage.getItem("keys");
    // tslint:disable-next-line:no-null-keyword
    if (keys === null || keys === "") {
      this.storage.setItem("keys", JSON.stringify([]));
    }
    this.currentSet = { name: "", number: 0 };
    this.navigateTo('Creator');
  }
}
