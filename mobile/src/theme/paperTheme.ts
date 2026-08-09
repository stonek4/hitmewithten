/**
 * Builds the app's light and dark themes on top of react-native-paper's MD3
 * themes, from `design-tokens.md`.
 *
 * There is **no second theming layer**: everything a component needs — Material
 * roles, the Page colours, the diff colours, spacing, radii, motion, the
 * notecard construction constants — hangs off the Paper theme and is read with
 * `useAppTheme()`.
 */

import { configureFonts, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import {
  darkColors,
  darkDiffColors,
  darkPageColors,
  fontFamilies,
  haptics,
  lightColors,
  lightDiffColors,
  lightPageColors,
  motion,
  pageSurface,
  radii,
  spacing,
  typography,
} from './tokens';
import type { DiffColors, PageColors, SchemeColors, TypeVariantName } from './tokens';

/** What this app adds on top of Paper's MD3 theme. */
export interface AppThemeExtras {
  /** The notecard surface's colours. Named `page`, not `paper`, to avoid
   *  confusion with the react-native-paper library (`design-tokens.md` §14). */
  page: PageColors;
  /** The spelling-diff palette. */
  diff: DiffColors;
}

/** The theme every component reads. */
export interface AppTheme extends MD3Theme {
  colors: MD3Theme['colors'] & SchemeColors & AppThemeExtras;
  spacing: typeof spacing;
  radii: typeof radii;
  motion: typeof motion;
  haptics: typeof haptics;
  /** The §9 notecard construction constants. Distinct from `colors.page`. */
  pageSurface: typeof pageSurface;
  /** True when this is the dark scheme, for the few places that must branch. */
  isDark: boolean;
}

/**
 * Convert the token type scale into the shape Paper's `configureFonts` wants.
 *
 * Includes the Page-only variants (`cardAnswer`, `diffCell`, …) so
 * `<Text variant="diffCell">` resolves through the same mechanism as the MD3
 * variants rather than needing a parallel system.
 *
 * @returns A font config keyed by variant name.
 */
function buildFontConfig(): Record<string, object> {
  const config: Record<string, object> = {};
  for (const [name, variant] of Object.entries(typography)) {
    config[name] = {
      fontFamily: fontFamilies[variant.family][variant.weight],
      fontSize: variant.size,
      lineHeight: variant.lineHeight,
      fontWeight: variant.weight,
      letterSpacing: variant.tracking,
    };
  }
  return config;
}

const fonts = configureFonts({ config: buildFontConfig() as never });

/**
 * Map the token surface-container roles onto Paper's `colors.elevation` levels
 * (`design-tokens.md` §14).
 *
 * @param scheme The scheme whose containers to map.
 * @returns Paper's five elevation surface colours.
 */
function elevationFor(scheme: SchemeColors): MD3Theme['colors']['elevation'] {
  return {
    level0: 'transparent',
    level1: scheme.surfaceContainerLow,
    level2: scheme.surfaceContainer,
    level3: scheme.surfaceContainerHigh,
    level4: scheme.surfaceContainerHighest,
    level5: scheme.surfaceContainerHighest,
  };
}

/**
 * Assemble one complete app theme.
 *
 * @param base Paper's MD3 light or dark theme.
 * @param scheme The Material chrome colours for this scheme.
 * @param page The notecard colours for this scheme.
 * @param diff The spelling-diff colours for this scheme.
 * @param isDark Whether this is the dark scheme.
 * @returns The theme handed to `PaperProvider`.
 */
function buildTheme(
  base: MD3Theme,
  scheme: SchemeColors,
  page: PageColors,
  diff: DiffColors,
  isDark: boolean,
): AppTheme {
  return {
    ...base,
    dark: isDark,
    isDark,
    fonts,
    colors: {
      ...base.colors,
      ...scheme,
      // MD3 models neither of these, so they hang off the theme by name.
      page,
      diff,
      elevation: elevationFor(scheme),
    },
    spacing,
    radii,
    motion,
    haptics,
    pageSurface,
  };
}

/** The light theme. */
export const lightTheme: AppTheme = buildTheme(
  MD3LightTheme,
  lightColors,
  lightPageColors,
  lightDiffColors,
  false,
);

/** The dark theme. */
export const darkTheme: AppTheme = buildTheme(
  MD3DarkTheme,
  darkColors,
  darkPageColors,
  darkDiffColors,
  true,
);

/**
 * Every text variant name in the app's type scale.
 *
 * The Page-only variants (`cardAnswer`, `diffCell`, …) are rendered through
 * `typeStyle()` rather than Paper's `<Text variant>` prop, whose type is closed
 * over the MD3 scale — see `theme/index.ts`.
 */
export type AppTextVariant = TypeVariantName;
