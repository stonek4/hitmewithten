import { Router, RouterConfiguration } from "aurelia-router";
export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Vocab Cards';
    config.map([
      { route: '',   moduleId: 'menu/menu', title: 'Menu', name: 'Menu'},
      { route: 'tester/:id', moduleId: 'tester/tester', name: 'Tester'},
      { route: 'creator/', moduleId: 'creator/creator', name: 'Creator'},
      { route: 'loader', moduleId: 'loader/loader', name: 'Loader'},
      { route: 'about', moduleId: 'about/about', name: 'About'}
    ]);

    this.router = router;
  }
}
