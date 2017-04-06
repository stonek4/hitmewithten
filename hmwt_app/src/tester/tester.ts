import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

interface Card{
  definitions: string[];
  answers: string[];
}

@inject(Router)
export class Tester {

  definition: string;
  answer: string;
  cards: Card[];
  index: number = 0;

  constructor(private router: Router){}

  activate(params, routeData){
    this.cards = routeData.settings;
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      this.cards = JSON.parse(window.localStorage.getItem(params.id));
    }
    if (this.cards === null || typeof this.cards.length === 'undefined'){
      this.done();
    }
    this.definition = this.cards[this.index].definitions[0];
  }

  attached(){
    (<HTMLElement>document.querySelector(".tester-input")).focus();
  }

  submit(){
    if (this.answer === this.cards[this.index].answers[0]){
      this.next();
    } else {

      var actual = this.cards[this.index].answers[0]
      var marked = "";
      var edit = this.calcDist(actual, this.answer);

      for (var i = 0; i < edit.length-1; i++){
        if (edit[i] === "n"){
          marked += actual[i];
        } else {
          if (edit[i] === "d"){
            actual = actual.slice(0, i) + "+" + actual.slice(i);
          } else if (edit[i] === "i"){
            actual = actual.slice(0, i) + "-" + actual.slice(i);
          }
          marked += "<em>"+actual[i]+"</em>"
          }
        }

      this.definition = marked;
      return;
    }
    (<HTMLElement>document.querySelector(".creator-definition")).focus();
  }

  next() {
    if (this.index+1 < this.cards.length) {
      this.index += 1;
      this.definition = this.cards[this.index].definitions[0];
      this.answer = "";
    }
    else {
      this.done();
    }
  }

  back() {
    if (this.index != 0){
      this.index -= 1;
      this.definition = this.cards[this.index].definitions[0];
      this.answer = "";
    }
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
        if (dist[i][j] === dist[i-1][j-1] + cost){
          paths[i][j] = [i-1, j-1];
          edits[i][j] = "s"
        } else if (dist[i][j] === dist[i-1][j]+1){
          paths[i][j] = [i-1, j];
          edits[i][j] = "d"
        } else {
          paths[i][j] = [i, j-1];
          edits[i][j] = "i"
        }
      }
    }

    var path = new Array(Math.max(aword.length, bword.length)+1)
    var edit = new Array(Math.max(aword.length, bword.length)+1)
    var prev_coord = [aword.length, bword.length]
    var coord = [aword.length, bword.length]

    for (i = path.length-1; i > -1; i--){
      path[i] = dist[coord[0]][coord[1]];
      if (i != path.length-1){
        if ( path[i+1] != path[i] ){
          edit[i] = edits[coord[0]][coord[1]];
        } else {
          edit[i] = "n"
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
    this.router.navigateToRoute('Menu');
  }
}
