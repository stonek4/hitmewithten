import {Router, RouterConfiguration, NavigationInstruction, RouteConfig} from "aurelia-router"
export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'hmwt';
    config.map([
      { route: ['','/'],   moduleId: 'tester/tester',   title: 'Menu'},
      { route: 'tester/:id', moduleId: 'tester/tester', name: 'Test'}
    ]);

    this.router = router;
  }
}
