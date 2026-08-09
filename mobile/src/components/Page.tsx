/**
 * `Page` — the notecard. The one component that renders the paper metaphor.
 *
 * Construction spec: `design/design-tokens.md` §9; component surface:
 * `design/spec.md` §3.1.
 *
 * Two contracts, both load-bearing:
 *
 * 1. It reads as a **ruled 3 × 5 index card** — header zone, warm header rule,
 *    writing rules, margin rule, card-stock thickness.
 * 2. **Every line of card text has its baseline exactly on a writing rule, at
 *    every dynamic-type scale.** The rule pitch is the *resolved* line height of
 *    `cardAnswer`, never a literal, which is what makes the grid survive
 *    dynamic type: raise the system font size and the rules grow with the text.
 *
 * The rules are drawn procedurally — zero raster assets, zero grain, one
 * pattern fill. There is no tile, so there is no seam at 1.5×, 2.75× or any
 * other density, and nothing about the card animates, so the texture never
 * re-rasterises mid-transition.
 */

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { usePageGrid, useAppTheme } from '@/theme';

/** Props for {@link Page}. */
export interface PageProps {
  /**
   * The field label, rendered in the unruled header zone — the one piece of
   * card text not sitting on a rule, and the exception is deliberate and total.
   * `null` collapses the zone and the header rule.
   */
  label?: ReactNode;
  /** Right-aligned header-zone slot, e.g. "3 / 10". */
  labelTrailing?: ReactNode;
  /** Writing rules in the body. Disable only for non-line content. */
  ruled?: boolean;
  /** The vertical margin rule. */
  margin?: boolean;
  /** A `stack-offset` sliver behind and below — "a card from a stack". */
  stacked?: boolean;
  /** Applies the page drop shadow (light scheme only; dark has no shadow). */
  elevated?: boolean;
  /** Which grid to use — the full card, or the compact results/insights grid. */
  grid?: 'full' | 'compact';
  /** Card body content. Every text run should set `lineHeight = rulePitch`. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The ruled notecard surface.
 *
 * @param props See {@link PageProps}.
 * @returns The rendered card.
 */
export function Page({
  label = null,
  labelTrailing,
  ruled = true,
  margin = true,
  stacked = false,
  elevated = true,
  grid = 'full',
  children,
  style,
  testID,
}: PageProps): React.JSX.Element {
  const theme = useAppTheme();
  const pageGrid = usePageGrid(grid);
  const { colors, pageSurface, radii, spacing } = theme;

  const hasHeader = label !== null || labelTrailing !== undefined;
  // With no header zone the grid starts at the body's own top edge.
  const gridOrigin = hasHeader
    ? pageGrid.gridOrigin
    : pageGrid.gridOrigin - pageGrid.headerZoneHeight - pageSurface.headerRuleWidth;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          backgroundColor: colors.page.surfaceShade,
          borderRadius: radii.large,
          marginStart: pageSurface.stackOffset,
          marginTop: pageSurface.stackOffset,
        },
        card: {
          backgroundColor: colors.page.surface,
          borderRadius: radii.large,
          borderWidth: pageSurface.edgeWidth,
          borderColor: colors.page.edge,
          overflow: 'hidden',
          // Shadows are invisible on a near-black desk, so dark mode gets none
          // and separation comes from the edge hairline plus the page being
          // lighter than the desk.
          ...(elevated && !theme.isDark
            ? {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }
            : null),
        },
        header: {
          height: pageGrid.headerZoneHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingStart: pageSurface.marginInset + pageSurface.marginGutter,
          paddingEnd: spacing[5],
        },
        headerRule: {
          height: pageSurface.headerRuleWidth,
          backgroundColor: colors.page.ruleStrong,
        },
        body: {
          minHeight: pageGrid.rulePitch * pageSurface.minBands,
          paddingStart: pageSurface.marginInset + pageSurface.marginGutter,
          paddingEnd: spacing[5],
        },
        thickness: {
          height: pageSurface.thickness,
          backgroundColor: colors.page.surfaceShade,
        },
      }),
    [colors, elevated, pageGrid, pageSurface, radii, spacing, theme.isDark],
  );

  const card = (
    <View style={[styles.card, style]} testID={testID}>
      {hasHeader ? (
        <>
          <View style={styles.header}>
            <View>{label}</View>
            <View>{labelTrailing}</View>
          </View>
          <View style={styles.headerRule} />
        </>
      ) : null}

      <View style={styles.body}>
        {ruled ? (
          <Rules
            pitch={pageGrid.rulePitch}
            origin={gridOrigin - (hasHeader ? pageGrid.headerZoneHeight + pageSurface.headerRuleWidth : 0)}
            ruleColor={colors.page.rule}
            marginColor={colors.page.margin}
            marginInset={margin ? pageSurface.marginInset : null}
            ruleWidth={pageSurface.ruleWidth}
          />
        ) : null}
        {children}
      </View>

      <View style={styles.thickness} />
    </View>
  );

  return stacked ? <View style={styles.stack}>{card}</View> : card;
}

/** Props for the internal {@link Rules} layer. */
interface RulesProps {
  pitch: number;
  origin: number;
  ruleColor: string;
  marginColor: string;
  marginInset: number | null;
  ruleWidth: number;
}

/**
 * The card's printed ruling: horizontal writing rules at baselines, plus the
 * vertical margin rule.
 *
 * A single SVG `<Pattern>` fill rather than N `<View>` children — per-rule
 * views would be N layout nodes re-measured on every reflow, which is the worst
 * option on low-end Android. This is a static, non-animated background layer
 * and is `pointerEvents="none"` so it can never intercept a touch.
 *
 * @param props See {@link RulesProps}.
 * @returns The absolutely-positioned ruling layer.
 */
function Rules({
  pitch,
  origin,
  ruleColor,
  marginColor,
  marginInset,
  ruleWidth,
}: RulesProps): React.JSX.Element {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      <Svg width="100%" height="100%">
        <Defs>
          {/* One pattern tile per rule pitch, with the rule at the tile's top
              edge; the pattern's y-offset is the grid origin, which is what
              puts every rule exactly on a baseline. */}
          <Pattern
            id="writingRules"
            x="0"
            y={origin}
            width="100%"
            height={pitch}
            patternUnits="userSpaceOnUse"
          >
            <Line
              x1="0"
              y1={ruleWidth / 2}
              x2="100%"
              y2={ruleWidth / 2}
              stroke={ruleColor}
              strokeWidth={ruleWidth}
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#writingRules)" />
        {marginInset !== null ? (
          <Line
            x1={marginInset}
            y1="0"
            x2={marginInset}
            y2="100%"
            stroke={marginColor}
            strokeWidth={ruleWidth}
          />
        ) : null}
      </Svg>
    </View>
  );
}
