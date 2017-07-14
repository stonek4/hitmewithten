export abstract class Trophy {
  name: string;
  abstract update(any?): void;
  abstract isObtained(): boolean;
}
