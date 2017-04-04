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

  submit(){
    if (this.answer === this.cards[this.index].answers[0]){
      this.next();
    } else {

      var actual = this.cards[this.index].answers[0]
      var marked = "";
      var path = this.calcDist(actual, this.answer);

      for (var i = 0; i < path.length-1; i++){
        if (path[i] < path[i+1]){
          if (i == actual.length){
            actual+="_";
          }
          marked += "<em>"+actual[i]+"</em>";
        } else {
          marked += actual[i];
        }
      }
      this.definition = marked;
      return;
    }
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

    for (var i = 0; i < dist.length; i++) {
      dist[i] = new Array(bword.length+1);
      paths[i] = new Array(bword.length+1);
    }
    for (var i = 0; i < dist.length; i++){
      paths[i][0] = [i-1, 0];
      dist[i][0] = i;
    }
    for (var j = 0; j < dist[0].length; j++){
      paths[0][j] = [0, j-1];
      dist[0][j] = j;
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
        } else if (dist[i][j] === dist[i-1][j]+1){
          paths[i][j] = [i-1, j];
        } else {
          paths[i][j] = [i, j-1];
        }
      }
    }
    var path = new Array(Math.max(aword.length, bword.length)+1)
    var coord = [aword.length, bword.length]
    for (i = path.length-1; i > -1; i--){
      console.log(coord)
      path[i] = dist[coord[0]][coord[1]];
      coord = paths[coord[0]][coord[1]];
    }
    return path;
  }

  done() {
    this.router.navigateToRoute('Menu');
  }
}
