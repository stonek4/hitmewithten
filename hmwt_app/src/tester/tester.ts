import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { CssAnimator } from 'aurelia-animator-css';
import { Card } from '../card';
import { Trophies } from '../trophies/trophies';
import { Globals } from '../globals';

const logger = LogManager.getLogger('tester');

@inject(Router, CssAnimator, Trophies, Globals)
export class Tester {
  /** The definition */
  public definition: string;
  /** The dom class of the definition */
  private definition_element: string = ".tester-text";
  /** The answer */
  public answer: string = "";
  /** The dom class of the answer */
  private input_element: string = ".tester-input";
  /** The set of cards */
  public cards: Card[];
  /** The index of the current card */
  public index: number = 0;
  /** The style of the progress bar */
  public progressStyle: string = "width:0%";
  /** The value of the progress bar */
  public progressValue: string = "0";

  private router: Router;
  private animator: CssAnimator;
  private trophies: Trophies;
  private globals: Globals;

  public constructor(router: Router, animator: CssAnimator, trophies: Trophies, globals: Globals) {
    logger.debug('constructing the tester class');
    this.animator = animator;
    this.trophies = trophies;
    this.router = router;
    this.globals = globals;
  }

  public activate(params, routeData) {

    logger.debug('activating the tester class');
    this.cards = routeData.settings;
    // tslint:disable-next-line:no-null-keyword
    if (this.cards === null || typeof this.cards.length === 'undefined') {
      logger.debug('cards were detected on the route, adding them');
      this.cards = JSON.parse(window.localStorage.getItem(<string>params.id + ".cards"));
    }
    // tslint:disable-next-line:no-null-keyword
    if (this.cards === null || typeof this.cards.length === 'undefined') {
      logger.warn('no cards detected, bailing out!');
      this.done();
    }
    this.definition = this.cards[this.index].definitions[0];
  }

  public attached() {
    logger.debug('attaching the tester');
    logger.debug('performing entrance animations');
    (<HTMLElement>document.querySelector(this.input_element)).focus();
    return this.globals.performEntranceAnimations('tester', 'slideInRight');
  }

  public submit() {
    logger.debug('answer was submitted');
    if (this.answer === this.cards[this.index].answers[0]) {
      logger.debug('answer is correct');
      this.trophies.updateCardsPassedTrophies(1);
      this.definition = "<correct>" + this.cards[this.index].answers[0] + "</correct>";
      setTimeout(() => {
        this.next();
      }, 200);
    } else {
      logger.debug('answer is incorrect');
      this.trophies.updateCardsFailedTrophies(1);
      let actual = this.cards[this.index].answers[0];
      let inputted = this.answer;
      let marked = "";
      const edit = this.calcDist(inputted, actual);

      logger.debug('edits made are: (none, substitute, insert, delete)');
      logger.debug(edit);

      if (edit.length === 1) {
        logger.debug('edit length is one, assuming insert');
        edit[0] = "i";
      }

      for (let i = 0; i < edit.length; i++) {
        if (edit[i] === "n") {
          marked += inputted[i];
        } else {
            if (edit[i] === "d") {
              marked += "<em>-</em>";
              actual = '-' + actual;
            } else if (edit[i] === "i") {
              inputted = inputted.slice(0, i) + actual[i] + inputted.slice(i);
              if (inputted[i] === " ") {
                marked += "<em>_</em>";
              } else {
                marked += "<em>" + inputted[i] + "</em>";
              }
            } else if (edit[i] === "s") {
              inputted = inputted.substr(0, i) + actual[i] + inputted.substr(i + 1, inputted.length);
              if (inputted[i] === " ") {
                marked += "<em>_</em>";
              } else {
                marked += "<em>" + inputted[i] + "</em>";
              }
            }
          }
        }

      logger.debug('displaying marked definition');
      this.definition = marked;
      this.animator.animate(document.querySelector(this.definition_element), 'shake');
    }
    (<HTMLElement>document.querySelector(this.input_element)).focus();
  }

  public next() {
    logger.debug('attempting to move to the next card');
    this.index += 1;
    this.trophies.updateCardsTestedTrophies(1);
    this.trophies.displayNewTrophies();
    this.updateProgress();
    return this.globals.performExitAnimations('tester-text', 'slideOutLeft').then(() => {
        if (this.index < this.cards.length) {
            this.definition = this.cards[this.index].definitions[0];
            this.answer = "";
            return this.globals.performEntranceAnimations('tester-text', 'slideInRight');
      } else {
          logger.debug('reached last card in the list');
          this.done();
      }
    });
  }

  public back() {
    logger.debug('attempting to move back to the previous card');
    if (this.index !== 0) {
      this.index -= 1;
      this.animator.animate(document.querySelector(this.definition_element), 'slideBack');
      setTimeout(() => {
        (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "0";
        setTimeout(() => {
          (<HTMLElement>document.querySelector(this.definition_element)).style.opacity = "1";
          this.definition = this.cards[this.index].definitions[0];
          this.answer = "";
        }, 50);
      }, 500);
      (<HTMLElement>document.querySelector(this.input_element)).focus();
    }
    else {
      logger.debug('there are no previous cards in the set, exiting');
      this.done();
    }
  }

  private updateProgress() {
    logger.debug('updating the progress bar');
    const progress = (this.index / this.cards.length) * 100;
    this.progressStyle = "width:" + progress.toString() + "%";
    this.progressValue = progress.toString();
    return;
  }

  private calcDist(aword: string, bword: string) {
    logger.debug('calculating the distance between ' + aword + ' and ' + bword);
    const dist = new Array<Array<number>>(aword.length + 1);
    const paths = new Array(aword.length + 1);
    const edits = new Array(aword.length + 1);

    for (let i = 0; i < dist.length; i++) {
      dist[i] = new Array(bword.length + 1);
      paths[i] = new Array(bword.length + 1);
      edits[i] = new Array(bword.length + 1);
    }

    for (let i = 0; i < dist.length; i++) {
      dist[i][0] = i;
      paths[i][0] = [i - 1, 0];
      edits[i][0] = "d";
    }
    for (let j = 0; j < dist[0].length; j++) {
      dist[0][j] = j;
      paths[0][j] = [0, j - 1];
      edits[0][j] = "i";
    }

    let cost: number = 0;
    for (let j = 1; j < dist[0].length; j++) {
      for (let i = 1; i < dist.length; i++) {
        if (aword[i - 1] === bword[j - 1]) {
          cost = 0;
        }
        else {
          cost = 1;
        }
        dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost);
        if (dist[i][j] === dist[i - 1][j] + 1) {
          paths[i][j] = [i - 1, j];
          edits[i][j] = "d";
        } else if (dist[i][j] === dist[i - 1][j - 1] + cost) {
          paths[i][j] = [i - 1, j - 1];
          edits[i][j] = "s";
        } else {
          paths[i][j] = [i, j - 1];
          edits[i][j] = "i";
        }
      }
    }

    logger.debug('finished calculating the distances of all possible paths');

    logger.debug('finding the shortest path');

    const path = new Array();
    const edit = new Array();
    let coord = [aword.length, bword.length];

    path.unshift(dist[coord[0]][coord[1]]);
    let prev_coord = coord;
    coord = paths[coord[0]][coord[1]];

    while (coord[0] !== -1 && coord[1] !== -1) {
      path.unshift(dist[coord[0]][coord[1]]);
      if ( path[1] !== path[0] ) {
        edit.unshift(edits[prev_coord[0]][prev_coord[1]]);
      } else {
        edit.unshift('n');
      }
      prev_coord = coord;
      coord = paths[coord[0]][coord[1]];
    }
    return edit;
  }

  public done() {
    logger.debug('exiting the tester');
    logger.debug('performing exit animations');
    this.globals.performExitAnimations('tester', 'slideOutRight').then(() => {
        this.router.history.navigateBack();
    }).catch(() => {
        logger.error('An error occurred while navigating away');
        this.router.navigateToRoute('Menu');
    });
  }
}
