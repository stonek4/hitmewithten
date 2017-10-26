import { CssAnimator } from 'aurelia-animator-css';
import { inject } from 'aurelia-framework';

@inject(CssAnimator)
export class Globals {

    private animator: CssAnimator;

    constructor(animator: CssAnimator) {
        this.animator = animator;
    }
    // tslint:disable-next-line
    private animationExitHandler = function(e) {
        (<HTMLElement>e.target).style.visibility = 'hidden';
        e.target.removeEventListener('animationend', this.animationEndHandler);
    };

    private animationEntranceHandler = function(e) {
        (<HTMLElement>e.target).style.visibility = 'visible';
        e.target.removeEventListener('animationend', this.animationEndHandler);
    }

    public performEntranceAnimations(elementClass: string, animation: string): Promise<any> {
        const promises = new Array<Promise<any>>();
        const elements = document.getElementsByClassName(elementClass);
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('animationend', this.animationEntranceHandler);
            promises.push(this.animator.animate(elements[i], animation));
        }
        return Promise.all(promises);
    }

    public performExitAnimations(elementClass: string, animation: string): Promise<any> {
        const promises = new Array<Promise<any>>();
        const elements = document.getElementsByClassName(elementClass);
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('animationend', this.animationExitHandler);
            promises.push(this.animator.animate(elements[i], animation));
        }
        return Promise.all(promises);
    }
}
