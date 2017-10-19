import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { CssAnimator } from 'aurelia-animator-css';
import { EventAggregator } from 'aurelia-event-aggregator';

const logger = LogManager.getLogger('about');

@inject(Router, CssAnimator, EventAggregator)
export class Menu {

  private router;
  private animator;
  private eventAggregator;

  constructor(router: Router, animator: CssAnimator, eventAggregator: EventAggregator) {
    this.router = router;
    this.animator = animator;
    this.eventAggregator = eventAggregator;
    logger.debug('constructing the about class');
  }

  private enterAnimations() {
    logger.debug('performing entrance animations');
    this.animator.animate(document.querySelector('.about-text-container'), 'slideInRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipInX');
  }

  private exitAnimations() {
    logger.debug('performing exit animations');
    this.animator.animate(document.querySelector('.about-text-container'), 'slidOutRight');
    this.animator.animate(document.querySelector('.about-back'), 'flipOutX');
  }

  public attached() {
    logger.debug('attaching the about');
    this.enterAnimations();
  }

  public back() {
    logger.debug('navigating back');
    this.exitAnimations();
    setTimeout(() => {
        this.router.history.navigateBack();
    }, 300);
  }
}
