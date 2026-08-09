/**
 * Every design value in the app, as typed constants.
 *
 * Transcribed from `design/design-tokens.md` §13, which is the single source of
 * truth. **No component may contain a hex value** — read these through
 * `useAppTheme()` instead.
 *
 * Naming note (`design-tokens.md` §14): the design language calls the notecard
 * surface "paper", but the UI library is also called `react-native-paper`. In
 * code the notecard colours are **`colors.page`** and its construction
 * constants are **`pageSurface`**, so the two can never be confused.
 */

/** Material 3 colour roles plus the Page and diff groups, for one scheme. */
export interface SchemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
  shadow: string;
}

/**
 * The notecard surface's colours (`design-tokens.md` §3).
 *
 * Hand-authored, deliberately **not** derived from the cool-blue seed: the Page
 * must read as a different *material*, not another tint of the same palette.
 * The rule contrasts sit far below the 3:1 UI threshold on purpose — a rule
 * that passes a contrast check has stopped being paper and become a divider.
 */
export interface PageColors {
  /** The card stock itself. */
  surface: string;
  /** The sheet behind the card, and the card's own bottom-edge thickness. */
  surfaceShade: string;
  /** 1 dp hairline at the card boundary. */
  edge: string;
  /** Writing rules — the horizontal lines text baselines sit on. */
  rule: string;
  /** Header rule — 2 dp, warm, colour-differentiated from the writing rules. */
  ruleStrong: string;
  /** The vertical margin rule. */
  margin: string;
  /** Card text — the "written" content. */
  ink: string;
  /** Labels and secondary text on the card. */
  inkVariant: string;
  /** The backdrop the card sits on. */
  desk: string;
}

/**
 * Spelling-diff colours (`design-tokens.md` §4), contrast-checked against
 * {@link PageColors.surface} rather than the app surface — the diff only ever
 * renders on a Page.
 *
 * **Colour is never the only signal.** Each of these is paired with a
 * non-colour mark; they make the feedback faster to read for people who can see
 * colour, never what makes it possible to read.
 */
export interface DiffColors {
  correct: string;
  correctContainer: string;
  wrong: string;
  wrongContainer: string;
  missing: string;
  missingContainer: string;
  /** Alias of `wrong` — an extra character is a wrong-letter error. */
  extra: string;
  /**
   * Alias of `wrong`. `transposed` deliberately shares the red: it *is* a
   * wrong-letter error, and it is already the most structurally distinctive
   * mark in the set (the only curve, the only mark spanning two cells), so it
   * needs hue least. A fourth hue would push the palette into CVD-marginal
   * territory to buy redundancy the one mark that does not need it.
   */
  transposed: string;
  transposedContainer: string;
  /** The "nothing belongs here" mark in the correct row. */
  void: string;
}

/** Light Material chrome — `design-tokens.md` §1. */
export const lightColors: SchemeColors = {
  primary: '#305DA8',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D8E2FF',
  onPrimaryContainer: '#001A41',
  secondary: '#565E71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DBE2F9',
  onSecondaryContainer: '#131B2C',
  tertiary: '#715574',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FBD7FC',
  onTertiaryContainer: '#29132D',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FAF9FD',
  onBackground: '#1B1B1F',
  surface: '#FAF9FD',
  onSurface: '#1B1B1F',
  surfaceVariant: '#E1E2EC',
  onSurfaceVariant: '#44474F',
  outline: '#74777F',
  outlineVariant: '#C4C6D0',
  surfaceDim: '#DBD9DD',
  surfaceBright: '#FAF9FD',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F5F3F7',
  surfaceContainer: '#EFEDF1',
  surfaceContainerHigh: '#E9E7EC',
  surfaceContainerHighest: '#E3E2E6',
  inverseSurface: '#303033',
  inverseOnSurface: '#F2F0F4',
  inversePrimary: '#ADC6FF',
  scrim: '#000000',
  shadow: '#000000',
};

/** Dark Material chrome — `design-tokens.md` §2. */
export const darkColors: SchemeColors = {
  primary: '#ADC6FF',
  onPrimary: '#002E68',
  primaryContainer: '#0D448E',
  onPrimaryContainer: '#D8E2FF',
  secondary: '#BFC6DC',
  onSecondary: '#283041',
  secondaryContainer: '#3F4759',
  onSecondaryContainer: '#DBE2F9',
  tertiary: '#DEBCDF',
  onTertiary: '#402843',
  tertiaryContainer: '#583E5B',
  onTertiaryContainer: '#FBD7FC',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#121316',
  onBackground: '#E3E2E6',
  surface: '#121316',
  onSurface: '#E3E2E6',
  surfaceVariant: '#44474F',
  onSurfaceVariant: '#C4C6D0',
  outline: '#8E9099',
  outlineVariant: '#44474F',
  surfaceDim: '#121316',
  surfaceBright: '#38393C',
  surfaceContainerLowest: '#0D0E11',
  surfaceContainerLow: '#1B1B1F',
  surfaceContainer: '#1F1F23',
  surfaceContainerHigh: '#292A2D',
  surfaceContainerHighest: '#343538',
  inverseSurface: '#E3E2E6',
  inverseOnSurface: '#303033',
  inversePrimary: '#305DA8',
  scrim: '#000000',
  shadow: '#000000',
};

/** Light Page — "cream index card under a desk lamp" (`design-tokens.md` §3.1). */
export const lightPageColors: PageColors = {
  surface: '#FCF8EE',
  surfaceShade: '#EFE8D8',
  edge: '#CFC7B4',
  rule: '#BFCBDD',
  ruleStrong: '#D19C94',
  margin: '#DFB3AC',
  ink: '#1B1B1F',
  inkVariant: '#4A4A52',
  desk: lightColors.surfaceContainerHigh,
};

/**
 * Dark Page — "toned card under low light" (`design-tokens.md` §3.2).
 *
 * **Not** an inverted texture: the page stays the warmest, most-lit surface in
 * the scene, and the rule polarity flips (lighter than the card) while the rule
 * *contrast ratio* stays sub-threshold.
 */
export const darkPageColors: PageColors = {
  surface: '#23262C',
  surfaceShade: '#1C1F24',
  edge: '#3B414D',
  rule: '#3C434F',
  ruleStrong: '#6A4340',
  margin: '#5E3C3A',
  ink: '#E8E4DC',
  inkVariant: '#B4AFA6',
  desk: darkColors.surface,
};

/** Light diff palette — `design-tokens.md` §4. */
export const lightDiffColors: DiffColors = {
  correct: '#146B3A',
  correctContainer: '#C8EBD5',
  wrong: '#B3261E',
  wrongContainer: '#FBE4E1',
  missing: '#6A3CA6',
  missingContainer: '#EFE6FB',
  extra: '#B3261E',
  transposed: '#B3261E',
  transposedContainer: '#FBE4E1',
  void: lightPageColors.rule,
};

/** Dark diff palette — `design-tokens.md` §4. */
export const darkDiffColors: DiffColors = {
  correct: '#7CD99E',
  correctContainer: '#0F4527',
  wrong: '#FFB4AB',
  wrongContainer: '#4B2B29',
  missing: '#D9BCFF',
  missingContainer: '#3B2E55',
  extra: '#FFB4AB',
  transposed: '#FFB4AB',
  transposedContainer: '#4B2B29',
  void: darkPageColors.rule,
};

/** 4 dp base grid — `design-tokens.md` §6. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Corner radii — `design-tokens.md` §7. */
export const radii = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
} as const;

/**
 * Minimum touch target in dp.
 *
 * The accessibility floor is 44; this app uses 48 (`design-tokens.md` §6).
 */
export const MIN_TOUCH_TARGET = 48;

/** Motion durations and easings — `design-tokens.md` §10. */
export const motion = {
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
  },
  named: {
    nav: 400,
    sessionOpen: 350,
    cardAdvance: 200,
    confirmHold: 300,
    diffAppear: 100,
    diffNudge: 150,
    progress: 250,
    toast: 200,
    press: 100,
    flip: 300,
  },
} as const;

/** Haptic patterns by event — `design-tokens.md` §11. Web is always a no-op. */
export const haptics = {
  answerCorrect: 'notificationSuccess',
  answerWrong: 'notificationError',
  trophyUnlocked: 'notificationSuccess',
  sessionComplete: 'impactMedium',
  destructiveConfirm: 'impactMedium',
} as const;

/**
 * The notecard construction constants — `design-tokens.md` §9.3.
 *
 * `rulePitch` is deliberately **absent**: it is the *resolved* line height of
 * `cardAnswer` (40 dp × the OS font scale), never a literal, which is what
 * makes the baseline grid survive dynamic type. Use `usePageGrid()`.
 */
export const pageSurface = {
  /** The font size that defines the grid (sp, before font scaling). */
  gridFontSize: 28,
  /** The unscaled line height that defines the rule pitch. */
  gridLineHeight: 40,
  /** Distance from the top of a line box to its baseline, per em. See below. */
  baselineK: 0.362,
  ruleWidth: 1,
  headerRuleWidth: 2,
  marginWidth: 1,
  marginInset: 40,
  marginGutter: 12,
  markOffset: 3,
  edgeWidth: 1,
  thickness: 3,
  stackOffset: 4,
  minBands: 5,
  /** Compact grid (results, insights) — same contract, different constants. */
  compactGridFontSize: 16,
  compactGridLineHeight: 24,
} as const;

/**
 * Distance from the top of a line box to its baseline.
 *
 * Derived in `design-tokens.md` §9.2:
 * `baselineOffset(F, L) = L/2 + F·(ascent − contentHeight/2)`. Inter and
 * JetBrains Mono agree on that second factor to within 0.004 em, so **one
 * constant covers both** and an Inter hint lands on the same grid as a
 * JetBrains Mono answer with no per-family adjustment.
 *
 * @param fontSize The resolved font size in dp.
 * @param lineHeight The resolved line height in dp.
 * @returns The baseline offset in dp.
 */
export function baselineOffset(fontSize: number, lineHeight: number): number {
  return lineHeight / 2 + pageSurface.baselineK * fontSize;
}

/**
 * The vertical nudge that puts a differently-sized text run back on the grid.
 *
 * Applied as `paddingTop: Δ` **plus** `marginBottom: −Δ`, so the run's total
 * advance stays an exact multiple of the rule pitch and the next line is still
 * in phase.
 *
 * @param fontSize The run's resolved font size in dp.
 * @param gridFontSize The grid-defining font size in dp.
 * @returns The offset Δ in dp; positive for text smaller than the grid size.
 */
export function gridOffset(fontSize: number, gridFontSize: number): number {
  return pageSurface.baselineK * (gridFontSize - fontSize);
}

/** One entry of the type scale. */
export interface TypeVariant {
  family: 'ui' | 'mono';
  size: number;
  lineHeight: number;
  weight: '400' | '500' | '600' | '700';
  tracking: number;
}

/**
 * The type scale — `design-tokens.md` §5.3.
 *
 * **Every line height in the notecard block is 40 dp, and that is the point.**
 * On a real card you write smaller or larger between the *same* printed lines;
 * you do not move the lines.
 */
export const typography = {
  displayLarge: { family: 'ui', size: 57, lineHeight: 64, weight: '400', tracking: -0.25 },
  displayMedium: { family: 'ui', size: 45, lineHeight: 52, weight: '400', tracking: 0 },
  displaySmall: { family: 'ui', size: 36, lineHeight: 44, weight: '400', tracking: 0 },
  headlineLarge: { family: 'ui', size: 32, lineHeight: 40, weight: '400', tracking: 0 },
  headlineMedium: { family: 'ui', size: 28, lineHeight: 36, weight: '400', tracking: 0 },
  headlineSmall: { family: 'ui', size: 24, lineHeight: 32, weight: '400', tracking: 0 },
  titleLarge: { family: 'ui', size: 22, lineHeight: 28, weight: '700', tracking: 0 },
  titleMedium: { family: 'ui', size: 16, lineHeight: 24, weight: '600', tracking: 0.15 },
  titleSmall: { family: 'ui', size: 14, lineHeight: 20, weight: '600', tracking: 0.1 },
  bodyLarge: { family: 'ui', size: 16, lineHeight: 24, weight: '400', tracking: 0.5 },
  bodyMedium: { family: 'ui', size: 14, lineHeight: 20, weight: '400', tracking: 0.25 },
  bodySmall: { family: 'ui', size: 12, lineHeight: 16, weight: '400', tracking: 0.4 },
  labelLarge: { family: 'ui', size: 14, lineHeight: 20, weight: '500', tracking: 0.1 },
  labelMedium: { family: 'ui', size: 12, lineHeight: 16, weight: '500', tracking: 0.5 },
  labelSmall: { family: 'ui', size: 11, lineHeight: 16, weight: '500', tracking: 0.5 },
  cardPrompt: { family: 'ui', size: 28, lineHeight: 40, weight: '400', tracking: 0 },
  cardPromptSmall: { family: 'ui', size: 22, lineHeight: 40, weight: '400', tracking: 0 },
  cardAnswer: { family: 'mono', size: 28, lineHeight: 40, weight: '500', tracking: 0.5 },
  diffCell: { family: 'mono', size: 28, lineHeight: 40, weight: '500', tracking: 1 },
  diffAttempt: { family: 'mono', size: 20, lineHeight: 40, weight: '400', tracking: 1 },
  diffCompact: { family: 'mono', size: 16, lineHeight: 24, weight: '500', tracking: 0.5 },
  paperLabel: { family: 'ui', size: 12, lineHeight: 16, weight: '500', tracking: 0.5 },
} as const satisfies Record<string, TypeVariant>;

/** Every variant name in the type scale. */
export type TypeVariantName = keyof typeof typography;

/**
 * Font family names as registered with `expo-font`, by family and weight.
 *
 * Falls back to the platform's system face when loading fails; the scale still
 * applies, only the metrics differ.
 */
export const fontFamilies = {
  ui: {
    '400': 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
  },
  mono: {
    '400': 'JetBrainsMono_400Regular',
    '500': 'JetBrainsMono_500Medium',
    '600': 'JetBrainsMono_500Medium',
    '700': 'JetBrainsMono_700Bold',
  },
} as const;
