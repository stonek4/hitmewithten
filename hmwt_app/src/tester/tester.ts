import {inject, LogManager} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {CssAnimator} from 'aurelia-animator-css';
import {Card} from '../card';

let logger = LogManager.getLogger('tester');

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

    logger.debug('constructing the tester class');
    this.animator = animator;

  }

  activate(params, routeData){

    logger.debug('activating the tester class');
    this.cards = routeData.settings;
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      logger.debug('cards were detected on the route, adding them');
      this.cards = JSON.parse(window.localStorage.getItem(params.id+".cards"));
    }
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      logger.warn('no cards detected, bailing out!')
      this.done();
    }
    this.definition = this.cards[this.index].definitions[0];
  }

  enterAnimations(){

    logger.debug('performing entrance animations')
    this.animator.animate(document.querySelector('.tester'), 'slideInRight');
    (<HTMLElement>document.querySelector(this.input_element)).focus();

  }

  exitAnimations(){

    logger.debug('performing exit animations');
    this.animator.animate(document.querySelector('.tester'), 'slideOutRight');

  }

  attached(){

    logger.debug('attaching the tester');
    this.enterAnimations();

  }

  submit(){

    logger.debug('answer was submitted');
    if (this.answer === this.cards[this.index].answers[0]){
      logger.debug('answer is correct');
      this.definition = "<correct>"+this.cards[this.index].answers[0]+"</correct>";
      setTimeout(() => {
        this.next();
      }, 200);
    } else {
      logger.debug('answer is incorrect');
      var actual = this.cards[this.index].answers[0]
      var inputted = this.answer;
      var marked = "";
      var edit = this.calcDist(inputted, actual);

      logger.debug('edits made are: (none, substitute, insert, delete)')
      logger.debug(edit);

      if (edit.length === 1){
        logger.debug('edit length is one, assuming insert');
        edit[0] = "i";
      }

      for (var i = 0; i < edit.length; i++){
        if (edit[i] === "n"){
          marked += inputted[i];
        } else {
            if (edit[i] === "d") {
              marked += "<em>-</em>";
              actual = '-' + actual;
            } else if (edit[i] === "i") {
              inputted = inputted.slice(0, i) + actual[i] + inputted.slice(i);
              marked += "<em>"+inputted[i]+"</em>";
            } else if (edit[i] === "s") {
              inputted = inputted.substr(0, i) + actual[i] + inputted.substr(i+1, inputted.length);
              marked += "<em>"+inputted[i]+"</em>";
            }
          }
        }

      logger.debug('displaying marked definition');
      this.definition = marked;
      this.animator.animate(document.querySelector(this.definition_element), 'shake');
    }
    (<HTMLElement>document.querySelector(this.input_element)).focus();

  }

  next() {

    logger.debug('attempting to move to the next card');
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
        logger.debug('there are no cards left in the list, exiting');
        setTimeout(() => {this.done()}, 500);
      }
    },500);
  }

  back() {

    logger.debug('attempting to move back to the previous card')
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
      logger.debug('there are no previous cards in the set, exiting')
      this.done();
    }
  }

  updateProgress(){

    logger.debug('updating the progress bar');
    let progress = (this.index / this.cards.length) * 100;
    this.progressStyle = "width:" + progress.toString() + "%";
    this.progressValue = progress.toString();
    return;

  }

  calcDist(aword, bword){

    logger.debug('calculating the distance between ' + aword + ' and ' + bword)
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

    logger.debug('finished calculating the distances of all possible paths')

    logger.debug('finding the shortest path');

    var path = new Array()
    var edit = new Array()
    var coord = [aword.length, bword.length]

    path.unshift(dist[coord[0]][coord[1]]);
    let prev_coord = coord;
    coord = paths[coord[0]][coord[1]];

    while (coord[0] != -1 && coord[1] != -1){
      path.unshift(dist[coord[0]][coord[1]]);
      if ( path[1] != path[0] ){
        edit.unshift(edits[prev_coord[0]][prev_coord[1]]);
      } else {
        edit.unshift('n');
      }
      prev_coord = coord;
      coord = paths[coord[0]][coord[1]];
    }
    return edit;
  }

  done() {

    logger.debug('exiting the tester');
    this.exitAnimations();
    setTimeout( () => {
      this.router.navigateToRoute('Menu');
    }, 300);

  }
}
