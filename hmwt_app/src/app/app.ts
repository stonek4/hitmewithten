import {Router, RouterConfiguration, NavigationInstruction, RouteConfig} from "aurelia-router"
export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'hmwt';
    config.map([
      { route: ['','/'],   moduleId: 'menu/menu',   title: 'Menu'},
      { route: 'tester/:id', moduleId: 'tester/tester', name: 'Tester'},
      { route: 'creator', moduleId: 'creator/creator', name: 'Creator'},
      { route: 'loader', moduleId: 'loader/loader', name: 'Loader'},
      { route: 'about', moduleId: 'about/about', name: 'About'}
    ]);

    this.router = router;
  }
}
