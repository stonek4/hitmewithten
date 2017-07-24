export abstract class Trophy {
  public name: string;
  protected displayText: string = "New Trophy: ";
  abstract update(any?): void;
  abstract isObtained(): boolean;
  abstract isNewlyObtained(): boolean;
}
