import {LogManager} from 'aurelia-framework';
import {Trophy, CardsTestedTrophy, CardsFailedTrophy, CardsPassedTrophy} from '../trophy';
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
        this.trophies.push(new CardsTestedTrophy(10));
        this.trophies.push(new CardsTestedTrophy(50));
        this.trophies.push(new CardsTestedTrophy(100));
        this.trophies.push(new CardsTestedTrophy(500));
        this.trophies.push(new CardsTestedTrophy(1000));
        this.trophies.push(new CardsTestedTrophy(5000));
        this.trophies.push(new CardsTestedTrophy(10000));
        this.trophies.push(new CardsTestedTrophy(50000));
        this.trophies.push(new CardsTestedTrophy(100000));

        this.trophies.push(new CardsPassedTrophy(50));
        this.trophies.push(new CardsPassedTrophy(100));
        this.trophies.push(new CardsPassedTrophy(500));
        this.trophies.push(new CardsPassedTrophy(1000));
        this.trophies.push(new CardsPassedTrophy(5000));
        this.trophies.push(new CardsPassedTrophy(10000));
        this.trophies.push(new CardsPassedTrophy(50000));
        this.trophies.push(new CardsPassedTrophy(100000));

        this.trophies.push(new CardsFailedTrophy(10));
        this.trophies.push(new CardsFailedTrophy(50));
        this.trophies.push(new CardsFailedTrophy(100));
        this.trophies.push(new CardsFailedTrophy(500));
        this.trophies.push(new CardsFailedTrophy(1000));
        this.trophies.push(new CardsFailedTrophy(5000));
        this.trophies.push(new CardsFailedTrophy(10000));
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
                case 'CardsPassedTrophy': {
                    let trophy = new CardsPassedTrophy();
                    trophy.load(trophyData[i]);
                    this.trophies.push(trophy);
                    break;
                }
                case 'CardsFailedTrophy': {
                    let trophy = new CardsFailedTrophy();
                    trophy.load(trophyData[i]);
                    this.trophies.push(trophy);
                    break;
                }
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

    private updateTrophyType(amount: number, type: string) {
        for (let i = 0; i < this.trophies.length; i++) {
            if (this.trophies[i].type === type) {
                if (!this.trophies[i].isObtained()) {
                    this.trophies[i].update(amount);
                }
            }
        }
    }

    public updateCardsTestedTrophies(amount: number) {
        if (!this.initialized) {
            this.initializeTrophies();
        }
        logger.debug('updating the cards tested trophies');
        this.updateTrophyType(amount, 'CardsTestedTrophy');
        this.save();
    }

    public updateCardsFailedTrophies(amount: number) {
        if (!this.initialized) {
            this.initializeTrophies();
        }
        logger.debug('updating the cards failed trophies');
        this.updateTrophyType(amount, 'CardsFailedTrophy');
        this.save();
    }

    public updateCardsPassedTrophies(amount: number) {
        if (!this.initialized) {
            this.initializeTrophies();
        }
        logger.debug('updating the cards passed trophies');
        this.updateTrophyType(amount, 'CardsPassedTrophy');
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
