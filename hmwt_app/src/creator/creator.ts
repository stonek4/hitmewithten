import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Card } from '../card';
import { Globals } from '../globals';

const logger = LogManager.getLogger("creator");

@inject(Router, EventAggregator, Globals)
export class Creator {

  /** The set of all cards */
  private cards: Card[] = [];
  /** The definition of the card */
  private definition: string = "";
  /** The answer of the card */
  private answer: string = "";
  /** The index of the current card */
  private index: number;
  /** The name of the current card */
  private name: string;

  private router: Router;
  private eventAggregator: EventAggregator;
  private globals: Globals;

  public constructor(router: Router, eventAggregator: EventAggregator, globals: Globals) {
    logger.debug("constructing the creator class");
    this.index = 0;
    this.eventAggregator = eventAggregator;
    this.router = router;
    this.globals = globals;
  }

  public activate(params, routeData) {

    logger.debug("creator route activated");
    if (params.id !== undefined) {
      logger.debug("cards were attached to the route");
      this.index = -1;
      this.cards = JSON.parse(window.localStorage.getItem(<string>params.id + ".cards"));
      this.name = params.id;
    } else {
      logger.debug("no cards were attached to the route, displaying the modal");
      this.eventAggregator.subscribeOnce('modal-closed', (payload) => {
        console.log(this.name);
        (<HTMLElement>document.querySelector('.creator-definition')).focus();
      });
    }
  }

  public attached() {
    logger.debug("attaching the loader");
    if (this.index === -1) {
      (<HTMLElement>document.querySelector('.modal')).style.display = 'none';
      (<HTMLElement>document.querySelector('.creator-definition')).focus();
      this.back();
    }
    logger.debug("displaying the entrance animations");
    this.globals.performEntranceAnimations('creator', 'slideInLeft')
    .catch((reason) => {
      console.error(reason);
    });
  }

  public next() {
    logger.debug("attempting to navigate to the next card");
    if (this.definition === "") {
      logger.debug("the definition is blank, aborting navigation");
      (<HTMLElement>document.querySelector(".creator-definition")).focus();
      return;
    }
    if ( this.answer === "") {
      logger.debug("the answer is blank, aborting navigation");
      (<HTMLElement>document.querySelector(".creator-answer")).focus();
      return;
    }

    const card: Card = { definitions: [this.definition], answers: [this.answer] };

    if (this.cards.length < this.index + 1) {
      logger.debug("this is a new card, added and moved to new blank card");
      this.cards.push(card);
      this.definition = "";
      this.answer = "";
    }
    else {
      logger.debug("this is an existing card, edits saved and moved to new blank card");
      this.cards[this.index] = card;
      if (this.cards.length === this.index + 1) {
        this.definition = "";
        this.answer = "";
      }
      else {
        logger.debug("this is an existing card, edits saved and moved to next existing card");
        this.definition = this.cards[this.index + 1].definitions[0];
        this.answer = this.cards[this.index + 1].answers[0];
      }
    }
    this.index += 1;
    (<HTMLElement>document.querySelector(".creator-definition")).focus();
  }

  public back() {
    logger.debug("attempting to move back a card");
    if (this.index > 0) {
      logger.debug("moving back to the previous card");
      this.definition = this.cards[this.index - 1].definitions[0];
      this.answer = this.cards[this.index - 1].answers[0];
      this.index -= 1;
    } else {
      logger.debug("no previous cards available");
      this.index = 0;
      if (this.cards.length > 0) {
        logger.debug("showing the first existing card");
        this.definition = this.cards[this.index].definitions[0];
        this.answer = this.cards[this.index].answers[0];
      }
      else {
        logger.debug("showing a blank card");
        this.definition = "";
        this.answer = "";
      }
    }
  }

  public delete() {
    logger.debug("deleting a card");
    if (this.cards.length > this.index) {
      this.cards.splice(this.index, 1);
    }
    this.back();
  }

  public done() {
    logger.debug("finished editing set of cards");
    if (this.definition !== "" && this.answer !== "") {
      logger.debug("saving the last card since it isn't blank");
      this.next();
    }
    logger.debug("saving the cards");
    const storage = window.localStorage;
    storage.setItem(this.name + ".cards", JSON.stringify(this.cards));
    const keys = JSON.parse(storage.getItem('keys'));
    if (keys.indexOf(this.name) === -1) {
      keys.push(this.name);
    }
    storage.setItem('keys', JSON.stringify(keys));
    storage.setItem('current', this.name);
    logger.debug("displaying the exit animations");
    this.globals.performExitAnimations('creator', 'slideOutLeft').then(() => {
        logger.debug("navigating back");
        this.router.history.navigateBack();
        this.router.history.navigateBack();
    }).catch(() => {
        logger.error('An error occurred while navigating away');
        this.router.navigateToRoute('Menu');
    });
  }
}
