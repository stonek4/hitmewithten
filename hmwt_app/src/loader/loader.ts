import {inject, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';
import {EventAggregator} from 'aurelia-event-aggregator';

interface CardSet{
  name: string;
  number: number;
}

let logger = LogManager.getLogger("loader");

@inject(Router, CssAnimator, EventAggregator)
export class Menu {

  sets: CardSet[] = [];
  storage = window.localStorage;
  action: string;
  currentSet: CardSet;
  actionSub: any;
  closeSub: any;

  constructor(private router: Router, private animator: CssAnimator, private eventAggregator: EventAggregator){

    logger.debug("constructing the logger class");
    this.animator = animator;
    this.loadData();

  }

  loadData(){

    logger.debug("loading the card list to display");
    let keys = JSON.parse(this.storage.getItem('keys'));
    if (keys != null){
      for(let i = 0; i < keys.length; i++){
        let nums = JSON.parse(this.storage.getItem(keys[i]+".cards")).length;
        this.sets.push({name:keys[i], number: nums});
      }
    }
  }

  enterAnimations(){

    logger.debug("performing entrance animations");
    this.animator.animate(document.querySelector('.list-group'), 'slideInLeft');
    this.animator.animate(document.querySelector('.loader-create'), 'flipInX');
    this.animator.animate(document.querySelector('.loader-upload'), 'flipInX');
    this.animator.animate(document.querySelector('.loader-back'), 'flipInX');

  }

  exitAnimations(){

    logger.debug("performing exit animations");
    this.animator.animate(document.querySelector('.list-group'), 'slideOutLeft');
    this.animator.animate(document.querySelector('.loader-create'), 'flipOutX');
    this.animator.animate(document.querySelector('.loader-upload'), 'flipOutX');
    this.animator.animate(document.querySelector('.loader-back'), 'flipOutX');

  }

  navigateTo(location:string){

    logger.debug("navigating to " + location);
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

    logger.debug("detaching the loader");
    this.actionSub.dispose();
    this.closeSub.dispose();

  }

  attached(){

    logger.debug("attaching the loader");
    (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
    this.enterAnimations();

    this.actionSub = this.eventAggregator.subscribe('modal-action', (action) => {
      logger.debug("the action was changed to " + action);
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

    logger.debug("showing the modal menu");
    this.currentSet = aset;
    (<HTMLElement>document.querySelector('.modal')).style.display = 'block';

  }

  load(){

    logger.debug("changing the current card set to " + this.currentSet.name);
    this.storage.setItem('current', this.currentSet.name);
    this.navigateTo('Menu');

  }

  upload(){

    logger.debug("prompting the user for a file");
    let loader = document.getElementById('loader-file')
    loader.click();
    loader.addEventListener('change', (event) => {this.import(event)}, false);

  }

  import(event){

    logger.debug("parsing the files that the user uploaded");
    var storage = window.localStorage;
    let reader = new FileReader;
    let files = event.target.files;
    let f: any;

    for (let i = 0; i < files.length; i++){

      logger.debug("parsing file " + i.toString());
      let f = files[i];

      logger.debug("reading the file");
      reader.readAsText(f);

      if (f.name.indexOf(".cards") !== -1){
        logger.debug("card set not found");
        let title = f.name.slice(0, -6);
        reader.onload = () => {

          logger.debug("card set is saving");
          if (title !== ""){
            let cards = reader.result;
            storage.setItem(title + ".cards", cards);
            var keys = JSON.parse(storage.getItem('keys'));
            if (keys.indexOf(title) === -1) {
              keys.push(title);
            }
            storage.setItem('keys', JSON.stringify(keys));
            logger.debug("card set has been saved");
          }
          this.sets = [];
          this.loadData();
        }
      }
    }

  }

  export(){

    logger.debug("exporting the card set " + this.currentSet.name);
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

    logger.debug("navigating back");
    this.navigateTo('Menu');

  }

  edit(){

    this.navigateTo('Creator');
    return;

  }

  delete(){

    logger.debug("removing the card set " + this.currentSet.name);
    this.storage.removeItem(this.currentSet.name+".cards");
    var keys = JSON.parse(this.storage.getItem('keys'));
    keys.splice(keys.indexOf(this.currentSet.name), 1);
    this.storage.setItem("keys", JSON.stringify(keys));
    this.sets = [];
    this.loadData();
    if (this.currentSet.name = this.storage.getItem('current')){
      this.storage.setItem('current', null);
    }

  }

  create(){

    logger.debug("user requested to create a new card set");
    var keys = this.storage.getItem("keys");
    if (keys === null || keys == ""){
      this.storage.setItem("keys", JSON.stringify([]))
    }
    this.currentSet = {name: "", number:0};
    this.navigateTo('Creator');

  }
}
