import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';
import {Card} from '../card';


@inject(Router, CssAnimator)
export class Tester {

  definition: string;
  definition_element: string = ".tester-text";

  answer: string = "";
  input_element: string = ".tester-input";

  cards: Card[];
  index: number = 0;
  progressStyle: string = "width:0%";
  progressValue: string = "0";

  constructor(private router: Router, private animator: CssAnimator){
    this.animator = animator;
  }

  activate(params, routeData){
    this.cards = routeData.settings;
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      this.cards = JSON.parse(window.localStorage.getItem(params.id+".cards"));
    }
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      this.done();
    }
    this.definition = this.cards[this.index].definitions[0];
  }

  enterAnimations(){
    this.animator.animate(document.querySelector('.tester'), 'slideInRight');
    (<HTMLElement>document.querySelector(this.input_element)).focus();
  }

  exitAnimations(){
    this.animator.animate(document.querySelector('.tester'), 'slideOutRight');
  }

  attached(){
    this.enterAnimations();
  }

  submit(){
    if (this.answer === this.cards[this.index].answers[0]){
      this.definition = "<correct>"+this.cards[this.index].answers[0]+"</correct>";
      setTimeout(() => {
        this.next();
      }, 200);
    } else {

      var actual = this.cards[this.index].answers[0]
      var marked = "";
      var edit = this.calcDist(this.answer, actual);
      if (edit.length === 1){
        edit[0] = "i";
      }

      for (var i = 0; i < edit.length; i++){
        if (edit[i] === "n"){
          marked += actual[i];
        } else {
          if (edit[i] === "d"){
            actual = actual.slice(0, i) + "-" + actual.slice(i);
          }
          marked += "<em>"+actual[i]+"</em>"
          }
        }

      this.definition = marked;
      this.animator.animate(document.querySelector(this.definition_element), 'shake');
    }
    (<HTMLElement>document.querySelector(this.input_element)).focus();
  }

  next() {
    this.animator.animate(document.querySelector(this.definition_element), 'slide');
    setTimeout(() => {
      (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "0";
      this.index += 1;
      this.updateProgress();
      if (this.index < this.cards.length) {
        setTimeout(() => {
          (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "1";
          this.definition = this.cards[this.index].definitions[0];
          this.answer = "";
        },50);
      }
      else {
        setTimeout(() => {this.done()}, 500);
      }
    },500);
  }

  back() {
    if (this.index != 0){
      this.index -= 1;
      this.animator.animate(document.querySelector(this.definition_element), 'slideBack');
      setTimeout(() => {
        (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "0";
        setTimeout(() => {
          (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "1";
          this.definition = this.cards[this.index].definitions[0];
          this.answer = "";
        },50);
      },500);
      (<HTMLElement>document.querySelector(this.input_element)).focus();
    }
    else{
      this.done();
    }
  }

  updateProgress(){
    let progress = (this.index / this.cards.length) * 100;
    this.progressStyle = "width:" + progress.toString() + "%";
    this.progressValue = progress.toString();
    return;
  }

  calcDist(aword, bword){
    var dist = new Array(aword.length+1);
    var paths = new Array(aword.length+1);
    var edits = new Array(aword.length+1);

    for (var i = 0; i < dist.length; i++) {
      dist[i] = new Array(bword.length+1);
      paths[i] = new Array(bword.length+1);
      edits[i] = new Array(bword.length+1);
    }

    for (var i = 0; i < dist.length; i++){
      dist[i][0] = i;
      paths[i][0] = [i-1, 0];
      edits[i][0] = "d"
    }
    for (var j = 0; j < dist[0].length; j++){
      dist[0][j] = j;
      paths[0][j] = [0, j-1];
      edits[0][j] = "i"
    }

    var cost: number = 0;
    for (var j = 1; j < dist[0].length; j++){
      for (var i = 1; i < dist.length; i++){
        if (aword[i-1] === bword[j-1]){
          cost = 0;
        }
        else{
          cost = 1;
        }
        dist[i][j] = Math.min(dist[i-1][j]+1, dist[i][j-1]+1, dist[i-1][j-1] + cost)
        if (dist[i][j] === dist[i-1][j]+1){
          paths[i][j] = [i-1, j];
          edits[i][j] = "d"
        } else if (dist[i][j] === dist[i-1][j-1] + cost){
          paths[i][j] = [i-1, j-1];
          edits[i][j] = "s"
        } else {
          paths[i][j] = [i, j-1];
          edits[i][j] = "i"
        }
      }
    }

    var path = new Array(Math.max(aword.length, bword.length))
    var edit = new Array(Math.max(aword.length, bword.length))
    var prev_coord = [aword.length, bword.length]
    var coord = [aword.length, bword.length]

    for (i = path.length-1; i > -1; i--){
      path[i] = dist[coord[0]][coord[1]];
      if (i != path.length-1){
        if ( path[i+1] != path[i] ){
          edit[i+1] = edits[prev_coord[0]][prev_coord[1]];
        } else {
          edit[i+1] = "n";
        }
        if (i == 0 && path[i] == 1){
          edit[i] = edits[coord[0]][coord[1]];
        } else {
          edit[i] = "n";
        }
      }
      else{
        edit[i] = "n"
      }

      prev_coord = coord;
      coord = paths[coord[0]][coord[1]];
    }
    return edit;
  }

  done() {
    this.exitAnimations();
    setTimeout( () => {
      this.router.navigateToRoute('Menu');
    }, 300);
  }
}
