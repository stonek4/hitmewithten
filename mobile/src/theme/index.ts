/**
 * The theme accessors every component uses.
 *
 * Read colours, spacing, radii and motion from here — never a hex literal in a
 * component (`design/spec.md` §3.0).
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import type { TextStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

import { darkTheme, lightTheme } from './paperTheme';
import type { AppTheme } from './paperTheme';
import { baselineOffset, fontFamilies, gridOffset, pageSurface, typography } from './tokens';
import type { TypeVariantName } from './tokens';

export { darkTheme, lightTheme } from './paperTheme';
export type { AppTheme } from './paperTheme';
export * from './tokens';

/**
 * Read the current app theme, typed.
 *
 * @returns The active {@link AppTheme}.
 */
export function useAppTheme(): AppTheme {
  return useTheme<AppTheme>();
}

/**
 * Resolve the theme for a colour scheme.
 *
 * @param scheme The scheme to resolve, or null/undefined for light.
 * @returns The matching {@link AppTheme}.
 */
export function themeForScheme(scheme: string | null | undefined): AppTheme {
  // Anything other than an explicit 'dark' resolves to light — including RN's
  // 'unspecified', which some platforms report before the scheme is known.
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Resolve one type-scale variant into a React Native text style.
 *
 * Used for the Page-only variants (`cardAnswer`, `diffCell`, `diffAttempt`, …).
 * react-native-paper's `<Text variant>` prop is typed against the MD3 scale
 * only, so driving these through the tokens directly is both simpler and
 * type-safe — and the diff strip already resolves its own font size for the
 * baseline grid, so Paper's variant would add nothing.
 *
 * @param name The variant to resolve.
 * @param overrides Font size and line height to use instead of the token
 *                  values, e.g. after applying the OS font scale.
 * @returns A text style carrying family, size, line height, weight and tracking.
 */
export function typeStyle(
  name: TypeVariantName,
  overrides: { fontSize?: number; lineHeight?: number } = {},
): TextStyle {
  const variant = typography[name];
  return {
    fontFamily: fontFamilies[variant.family][variant.weight],
    fontSize: overrides.fontSize ?? variant.size,
    lineHeight: overrides.lineHeight ?? variant.lineHeight,
    fontWeight: variant.weight,
    letterSpacing: variant.tracking,
  };
}

/** The resolved notecard baseline grid for the current font scale. */
export interface PageGrid {
  /** The OS font scale currently in effect. */
  fontScale: number;
  /** The resolved grid-defining font size, in dp. */
  gridFontSize: number;
  /**
   * The distance between writing rules, in dp — the **resolved** line height of
   * `cardAnswer`, never a literal. This is what makes the grid survive dynamic
   * type: raise the system font size and the rules grow with the text, so the
   * card simply has fewer, taller bands and every baseline still lands.
   */
  rulePitch: number;
  /** Height of the unruled header zone, in dp (one rule pitch). */
  headerZoneHeight: number;
  /**
   * Where rule 0 is drawn, in dp from the top of the card body. Every rule sits
   * at `gridOrigin + k · rulePitch`, and every rule is drawn exactly at a
   * baseline — so glyphs sit *on* the rule and descenders drop below it, which
   * is what writing on a ruled card looks like.
   */
  gridOrigin: number;
  /**
   * The paddingTop/−marginBottom nudge that puts a run of the given font size
   * back on the grid.
   *
   * @param fontSize The run's unscaled font size in dp.
   * @returns The offset Δ in dp.
   */
  offsetFor(fontSize: number): number;
}

/**
 * Resolve the notecard's baseline grid at the user's current font scale.
 *
 * The whole `design-tokens.md` §9.2 contract in one hook: no screen does this
 * arithmetic by hand.
 *
 * @param variant Which grid to resolve — the full card, or the compact grid
 *                used by results and insights rows. Defaults to `'full'`.
 * @returns The resolved {@link PageGrid}.
 */
export function usePageGrid(variant: 'full' | 'compact' = 'full'): PageGrid {
  const { fontScale } = useWindowDimensions();
  return useMemo(() => {
    const baseFontSize =
      variant === 'compact' ? pageSurface.compactGridFontSize : pageSurface.gridFontSize;
    const baseLineHeight =
      variant === 'compact' ? pageSurface.compactGridLineHeight : pageSurface.gridLineHeight;

    const gridFontSize = baseFontSize * fontScale;
    const rulePitch = baseLineHeight * fontScale;
    const headerZoneHeight = rulePitch;

    return {
      fontScale,
      gridFontSize,
      rulePitch,
      headerZoneHeight,
      gridOrigin:
        headerZoneHeight + pageSurface.headerRuleWidth + baselineOffset(gridFontSize, rulePitch),
      offsetFor: (fontSize: number) => gridOffset(fontSize * fontScale, gridFontSize),
    };
  }, [fontScale, variant]);
}
