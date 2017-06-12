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
    this.loadData();
  }

  loadData(){
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
    this.storage.setItem('current', this.currentSet.name);
    this.navigateTo('Menu');
  }

  upload(){
    let loader = document.getElementById('loader-file')
    loader.click();
    loader.addEventListener('change', (event) => {this.import(event)}, false);
  }

  import(event){
    console.log("parsing the file");
    var storage = window.localStorage;
    let reader = new FileReader;
    let files = event.target.files;
    let f: any;
    for (let i = 0; i < files.length; i++){
      let f = files[i];
      reader.readAsText(f);
      if (f.name.indexOf(".cards") !== -1){
        let title = f.name.slice(0, -6);
        reader.onload = () => {
          if (title !== ""){
            let cards = reader.result;
            storage.setItem(title + ".cards", cards);
            var keys = JSON.parse(storage.getItem('keys'));
            if (keys.indexOf(title) === -1) {
              keys.push(title);
            }
            storage.setItem('keys', JSON.stringify(keys));
          }
          this.sets = [];
          this.loadData();
        }
      }
    }
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
    this.sets = [];
    this.loadData();
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
