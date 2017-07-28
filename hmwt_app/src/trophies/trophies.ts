import {LogManager} from 'aurelia-framework';
import {Trophy} from '../trophy';
import {Notification} from '../notification/notification';
import 'bootstrap-notify';

let notifier = new Notification();

let logger = LogManager.getLogger('trophies');

export class Trophies {
    private trophies: Trophy[];

    private initialized: boolean = false;
    private storage = window.localStorage;

    public initializeTrophies() {
        if (this.initialized) {
            return;
        }
        logger.debug('initializing the trophies');
        this.initialized = true;
        this.load();
        if (this.trophies !== undefined){
            return;
        }
        logger.debug('creating a brand new set of trophies');
        this.trophies = new Array<Trophy>();
        this.trophies.push(new CardsTestedTrophy(5));
        this.trophies.push(new CardsTestedTrophy(10));
        this.trophies.push(new CardsTestedTrophy(50));
        this.trophies.push(new CardsTestedTrophy(100));
        this.trophies.push(new CardsTestedTrophy(500));
        this.trophies.push(new CardsTestedTrophy(1000));
        this.trophies.push(new CardsTestedTrophy(5000));
        this.trophies.push(new CardsTestedTrophy(10000));
        this.trophies.push(new CardsTestedTrophy(50000));
        this.trophies.push(new CardsTestedTrophy(100000));
        this.save();
    }

    private save() {
        logger.debug('saving the trophies');
        this.storage.setItem('trophies', JSON.stringify(this.trophies));
    }

    private load() {
        logger.debug('loading the trophies from storage');
        const trophyString = this.storage.getItem('trophies');
        if (trophyString === null) {
            logger.debug('no trophies were found in storage');
            return;
        }
        let trophyData = JSON.parse(trophyString);
        this.trophies = new Array<Trophy>();
        logger.debug('loading individual trophy data');
        for (let i = 0; i < trophyData.length; i++) {
            switch(trophyData[i].type) {
                case 'CardsTestedTrophy': {
                    let trophy = new CardsTestedTrophy();
                    trophy.load(trophyData[i]);
                    this.trophies.push(trophy);
                    break;
                }
            }
        }
        logger.debug('trophies were loaded from local storage successfully');
    }

    public updateCardsTestedTrophies(amount: number) {
        if (!this.initialized) {
            this.initializeTrophies();
        }
        logger.debug('updating the cards tested trophies');
        for (let i = 0; i < this.trophies.length; i++) {
            if (!this.trophies[i].isObtained()) {
                this.trophies[i].update(amount);
            }
        }
        this.save();
    }

    public displayNewTrophies() {
        if (!this.initialized) {
            this.initializeTrophies();
        }
        logger.debug('displaying new trophies that were obtained');
        for (let i = 0; i < this.trophies.length; i++) {
            if (this.trophies[i].isNewlyObtained()) {
                notifier.display(this.trophies[i].displayText, this.trophies[i].displayTitle);
                this.save();
            }
        }
    }
}

class CardsTestedTrophy extends Trophy {
    private cards: number = 0;
    private goal: number;
    private newObtained: boolean = true;

    constructor(goal?: number) {
        super();
        this.type = 'CardsTestedTrophy';
        if (goal !== undefined) {
            this.goal = goal;
        }
        this.displayText = `Used ${this.goal} cards.`;
    }

    load(data) {
        this.cards = data.cards;
        this.goal = data.goal;
        this.newObtained = data.newObtained;
        this.displayText = data.displayText;
        this.type = data.type;
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
