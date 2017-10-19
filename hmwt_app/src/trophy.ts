//tslint:disable:max-classes-per-file
export abstract class Trophy {
  /** The name of the trophy */
  public name: string;
  /** The type of the trophy */
  public type: string;
  /** The display title upon achieving the trophy */
  public displayTitle: string = "New Trophy Unlocked!";
  /** The display text upon achieving the trophy */
  public displayText: string;
  abstract updateTrophy(data?: any): void;
  abstract isObtained(): boolean;
  abstract isNewlyObtained(): boolean;
}

export class CardsTestedTrophy extends Trophy {
    protected cards: number = 0;
    protected goal: number;
    protected newObtained: boolean = true;

    public constructor(goal?: number) {
        super();
        this.type = 'CardsTestedTrophy';
        if (goal !== undefined) {
            this.goal = goal;
        }
        this.displayText = `Used ${this.goal} cards.`;
    }

    public load(data) {
        this.cards = data.cards;
        this.goal = data.goal;
        this.newObtained = data.newObtained;
        this.displayText = data.displayText;
        this.type = data.type;
    }

    public updateTrophy(amount: number) {
        this.cards += amount;
    }

    public isNewlyObtained() {
        if ((this.cards >= this.goal) && this.newObtained) {
            this.newObtained = false;
            return true;
        }
        return false;
    }

    public isObtained() {
        return this.cards >= this.goal;
    }
}

export class CardsFailedTrophy extends CardsTestedTrophy {
    protected cards: number = 0;
    protected goal: number;
    protected newObtained: boolean = true;

    public constructor(goal?: number) {
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

    public constructor(goal?: number) {
        super(goal);
        this.type = 'CardsPassedTrophy';
        if (goal !== undefined) {
            this.goal = goal;
        }
        this.displayText = `Successfully spelled ${this.goal} cards.`;
    }
}
