export abstract class Trophy {
  public name: string;
  public type: string;
  public displayTitle: string = "New Trophy Unlocked!";
  public displayText: string;
  abstract update(any?): void;
  abstract isObtained(): boolean;
  abstract isNewlyObtained(): boolean;
}

export class CardsTestedTrophy extends Trophy {
    protected cards: number = 0;
    protected goal: number;
    protected newObtained: boolean = true;

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

export class CardsFailedTrophy extends CardsTestedTrophy {
    protected cards: number = 0;
    protected goal: number;
    protected newObtained: boolean = true;

    constructor(goal?: number) {
        super(goal);
        this.type = 'CardsFailedTrophy';
        if (goal !== undefined) {
            this.goal = goal;
        }
        this.displayText = `Failed to spell ${this.goal} cards.`;
    }
}

export class CardsPassedTrophy extends CardsTestedTrophy {
    protected cards: number = 0;
    protected goal: number;
    protected newObtained: boolean = true;

    constructor(goal?: number) {
        super(goal);
        this.type = 'CardsPassedTrophy';
        if (goal !== undefined) {
            this.goal = goal;
        }
        this.displayText = `Successfully spelled ${this.goal} cards.`;
    }
}
