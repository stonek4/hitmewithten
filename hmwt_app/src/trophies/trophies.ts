import {LogManager} from 'aurelia-framework';
import {Trophy} from '../trophy';

let logger = LogManager.getLogger('trophies');

export class Trophies {
    private trophies = new Array<Trophy>();

    initializeTrophies() {
        this.trophies.push(new CardsTestedTrophy(5));
        this.trophies.push(new CardsTestedTrophy(10));
        this.trophies.push(new CardsTestedTrophy(50));
        this.trophies.push(new CardsTestedTrophy(100));
        this.trophies.push(new CardsTestedTrophy(500));
        this.trophies.push(new CardsTestedTrophy(1000));
        this.trophies.push(new CardsTestedTrophy(5000));
        this.trophies.push(new CardsTestedTrophy(10000));
    }

    updateCardsTestedTrophies(amount: number) {
        for (let i = 0; i < this.trophies.length; i++) {
            this.trophies[i].update(amount);
        }
    }

    displayNewTrophies() {
        for (let i = 0; i < this.trophies.length; i++) {
            if (this.trophies[i].isNewlyObtained()) {

            }
        }
    }
}

class CardsTestedTrophy extends Trophy {
    private cards: number = 0;
    private goal: number;
    private newObtained: boolean = true;
    private displayText = super.displayText + `Tested ${this.cards} cards!`

    constructor(goal: number) {
        super();
        this.goal = goal;
    }

    update(amount: number) {
        this.cards += amount;
    }

    isNewlyObtained() {
        if ((this.cards >= this.goal) && this.newObtained) {
            this.newObtained = false;
            return true;
        }
        return false;
    }

    isObtained() {
        return this.cards >= this.goal;
    }
}
