import {LogManager} from 'aurelia-framework';
import {Trophy} from '../trophy';

let logger = LogManager.getLogger('trophies');

export class Trophies {

}

class CardsTestedTrophy extends Trophy {
    cards: number = 0;
    goal: number;

    constructor(goal: number) {
        super();
        this.goal = goal;
    }

    update(amount: number) {
        this.cards += amount;
    }

    isObtained() {
        return this.cards >= this.goal;
    }
}
