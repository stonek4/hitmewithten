import { inject, LogManager } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Globals } from '../globals';

const logger = LogManager.getLogger('about');

@inject(Router, Globals)
export class Menu {

  private router: Router;
  private globals: Globals;

  constructor(router: Router, globals: Globals) {
    this.router = router;
    this.globals = globals;
    logger.debug('constructing the about class');
  }

  public attached() {
    logger.debug('performing entrance animations');
    const promises = new Array<Promise<any>>();
    promises.push(this.globals.performEntranceAnimations('about-text-container', 'slideInRight'));
    promises.push(this.globals.performEntranceAnimations('about-back', 'fliptInX'));
    return Promise.all(promises);
  }

  public back() {
    logger.debug('navigating back');
    logger.debug('performing exit animations');
    const promises = new Array<Promise<any>>();
    promises.push(this.globals.performExitAnimations('about-text-container', 'slideOutRight'));
    promises.push(this.globals.performExitAnimations('about-back', 'flipOutX'));
    Promise.all(promises).then(() => {
        this.router.history.navigateBack();
    }).catch(() => {
        logger.error('An error occurred while navigating away');
        this.router.navigateToRoute('Menu');
    });
  }
}
