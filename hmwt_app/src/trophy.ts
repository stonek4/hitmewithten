export abstract class Trophy {
  public name: string;
  public type: string;
  public displayTitle: string = "New Trophy Unlocked!";
  public displayText: string;
  abstract update(any?): void;
  abstract isObtained(): boolean;
  abstract isNewlyObtained(): boolean;
}
