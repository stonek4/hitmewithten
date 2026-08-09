/**
 * `DiffStrip` — the spelling-feedback moment. **The most important component in
 * the app**: it is the reason the product exists.
 *
 * Normative contract: `documentation/spelling-diff-spec.md` §7.
 * Visual spec: `design/spec.md` §3.2.
 *
 * The rules that must not be lost in any future edit:
 *
 * - **Never colour alone.** Every non-`ok` status carries 2–4 non-colour
 *   signals, so the five kinds are separable by shape alone: solid underline ·
 *   dashed underline · void cell · curve across two cells · nothing.
 * - **A space error is always visibly marked.** A segment whose `char` is `' '`
 *   and whose status is not `ok` renders a full-width `#` — the proofreader's
 *   insert-a-space mark. If it ever renders as literal whitespace the feature
 *   is gone and nobody notices until a user complains.
 * - **A transposed pair reads as ONE error**, marked with a single ribbon
 *   spanning both cells, **grouped by `pairId` and never by adjacency**.
 * - The correct spelling is always fully readable through the marking.
 * - Individual cells are hidden from the screen reader; the strip's own polite
 *   live-region announcement is the accessible representation.
 */

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { DiffSegment } from '@/features/evaluation/types';
import { spellOutRuns, summarizeDiff, toColumns } from '@/features/feedback/logic';
import type { DiffColumn, DiffErrorDescriptor } from '@/features/feedback/logic';
import { useFadeIn, useNudge, useReduceMotion } from '@/lib/motion';
import { baselineOffset, typeStyle, typography, useAppTheme, usePageGrid } from '@/theme';
import type { AppTheme, TypeVariantName } from '@/theme';

/**
 * JetBrains Mono's advance width, in ems.
 *
 * The columns are fixed-width so the two rows align **by construction rather
 * than by luck**; a proportional face or an icon in the grid would break the
 * advance and destroy the alignment the whole feature depends on.
 */
const MONO_ADVANCE_EM = 0.6;

/** The proofreader's insert-a-space mark. */
const SPACE_MARK = '#';
/** The proofreader's insertion caret, shown in the attempt row. */
const CARET_MARK = '∧';
/** The "nothing belongs here" mark in the correct row. */
const VOID_MARK = '·';

/** Props for {@link DiffStrip}. */
export interface DiffStripProps {
  /** Structured data — **never** an HTML string, and never re-derived here. */
  diff: readonly DiffSegment[];
  /** What the user submitted. Used only for the accessible label. */
  typedRaw: string;
  /** US-D6: render the user's own attempt above the correct spelling. */
  showAttempt?: boolean;
  /** `compact` is the results screen's missed-word row. */
  size?: 'full' | 'compact';
  testID?: string;
}

/**
 * Render one `AnswerEvaluation`'s diff.
 *
 * @param props See {@link DiffStripProps}.
 * @returns The rendered feedback strip.
 */
export function DiffStrip({
  diff,
  typedRaw,
  showAttempt = false,
  size = 'full',
  testID,
}: DiffStripProps): React.JSX.Element {
  const theme = useAppTheme();
  const grid = usePageGrid(size === 'compact' ? 'compact' : 'full');

  const columns = useMemo(() => toColumns(diff), [diff]);
  const announcement = useAnnouncement(diff);

  // Decoration only. Both values rest at identity — opacity 1, translateX 0 —
  // so a skipped, interrupted or disabled animation leaves the strip fully
  // visible and exactly in place. Motion never carries state here.
  const { reduceMotion, resolved } = useReduceMotion();
  // Treat "not yet known" as reduce-motion: erring toward no movement is always
  // safe, and moving the screen for someone who asked us not to is not.
  const suppressMotion = reduceMotion || !resolved;
  const opacity = useFadeIn(diff, suppressMotion);
  const { translateX, nudge } = useNudge(suppressMotion);

  useEffect(() => {
    // The attention nudge fires with each new diff. Under reduce-motion this is
    // a no-op and the diff itself is still shown — the feedback is never
    // removed, only the movement.
    nudge();
    // `nudge` is stable enough for this purpose and intentionally excluded; the
    // trigger is the diff changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diff, suppressMotion]);

  const correctVariant: TypeVariantName = size === 'compact' ? 'diffCompact' : 'diffCell';
  const correctFontSize = typography[correctVariant].size * grid.fontScale;
  const attemptFontSize = typography.diffAttempt.size * grid.fontScale;
  const columnWidth = correctFontSize * MONO_ADVANCE_EM + typography[correctVariant].tracking;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { alignSelf: 'flex-start' },
        row: { flexDirection: 'row', flexWrap: 'wrap' },
      }),
    [],
  );

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateX }] }]}
      testID={testID}
      // Polite, never assertive: it must not interrupt the user typing their
      // retry. The composed sentence is the accessible representation of the
      // whole strip — see the cells' accessibilityElementsHidden below.
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={announcement}
    >
      {showAttempt ? (
        <View style={styles.row} testID={testID === undefined ? undefined : `${testID}-attempt`}>
          {columns.map((column) => (
            <DiffCell
              key={`attempt-${column.index}`}
              column={column}
              row="attempt"
              theme={theme}
              width={columnWidth}
              pitch={grid.rulePitch}
              fontSize={attemptFontSize}
              gridFontSize={grid.gridFontSize}
              variant="diffAttempt"
            />
          ))}
        </View>
      ) : null}

      <View style={styles.row} testID={testID === undefined ? undefined : `${testID}-correct`}>
        {columns.map((column) => (
          <DiffCell
            key={`correct-${column.index}`}
            column={column}
            row="correct"
            theme={theme}
            width={columnWidth}
            pitch={grid.rulePitch}
            fontSize={correctFontSize}
            gridFontSize={grid.gridFontSize}
            variant={correctVariant}
          />
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * Compose the screen-reader announcement from the same `DiffSegment[]`.
 *
 * Every sentence is a full ICU message with parameters — never built by
 * concatenating fragments, which cannot be translated.
 *
 * @param diff The diff to describe.
 * @returns The announcement sentence.
 */
function useAnnouncement(diff: readonly DiffSegment[]): string {
  const { t } = useTranslation();
  return useMemo(() => {
    // Spell the answer letter by letter — reading "ravenous" as a word tells a
    // screen-reader user nothing about spelling.
    const runs = spellOutRuns(diff).map((run) => run.join('-'));
    const spelled = runs.join(`, ${t('diff.spelledSpace')}, `);

    const { errors, more } = summarizeDiff(diff);
    const sentences = errors.map((error) => describeError(error, t));
    if (more > 0) sentences.push(t('diff.andMore', { count: more }));

    if (sentences.length === 0) return t('diff.announcementNoDetail', { spelled });
    return t('diff.announcement', { spelled, errors: sentences.join(' ') });
  }, [diff, t]);
}

/**
 * Turn one error descriptor into its translated sentence.
 *
 * @param error The descriptor to describe.
 * @param t The i18n translate function.
 * @returns The translated sentence.
 */
function describeError(
  error: DiffErrorDescriptor,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  switch (error.kind) {
    case 'missing':
      return t('diff.error.missing', { char: error.char });
    case 'missingSpace':
      return t('diff.error.missingSpace');
    case 'wrong':
      return t('diff.error.wrong', { char: error.char, typed: error.typed });
    case 'extra':
      return t('diff.error.extra', { typed: error.typed });
    case 'extraSpace':
      return t('diff.error.extraSpace');
    case 'transposed':
      // One sentence for the pair, never two wrong-letter reports.
      return t('diff.error.transposed', { first: error.first, second: error.second });
  }
}

/** Props for the internal {@link DiffCell}. */
interface DiffCellProps {
  column: DiffColumn;
  row: 'attempt' | 'correct';
  theme: AppTheme;
  width: number;
  pitch: number;
  fontSize: number;
  gridFontSize: number;
  variant: TypeVariantName;
}

/**
 * One column of a {@link DiffStrip}: a fixed-width cell whose glyph sits on the
 * grid, plus the mark beneath it.
 *
 * The mark is drawn `markOffset` (3 dp) **below** the baseline at 2 dp in a
 * saturated diff colour, while the card's own writing rule sits *at* the
 * baseline at 1 dp and ~1.55:1 — four separating axes (position, weight,
 * contrast, hue) so the paper's line and the pen's mark are never confusable.
 *
 * @param props See {@link DiffCellProps}.
 * @returns The rendered cell.
 */
function DiffCell({
  column,
  row,
  theme,
  width,
  pitch,
  fontSize,
  gridFontSize,
  variant,
}: DiffCellProps): React.JSX.Element {
  const { segment, pairPosition, ownsRibbon } = column;
  const { colors, pageSurface } = theme;
  const isSpace = segment.char === ' ' || (segment.status === 'extra' && segment.typed === ' ');

  const { glyph, color, strike } = resolveGlyph(segment, row, isSpace, colors);
  const wash = resolveWash(segment.status, colors);
  const underline = row === 'correct' ? resolveUnderline(segment.status) : null;

  // The baseline this cell's glyph sits on, measured from the cell's top edge.
  const baseline = baselineOffset(fontSize, pitch);

  const styles = StyleSheet.create({
    cell: { width, height: pitch, justifyContent: 'flex-start' },
    washLayer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      backgroundColor: wash ?? 'transparent',
      borderRadius: theme.radii.extraSmall,
    },
    // A washed cell repaints the card's writing rule at its own baseline, so
    // the ruling stays continuous across it — the card's lines are printed and
    // the marking sits on top of them.
    ruleRepaint: {
      position: 'absolute',
      start: 0,
      end: 0,
      top: baseline,
      height: pageSurface.ruleWidth,
      backgroundColor: colors.page.rule,
    },
    text: {
      ...typeStyle(variant, { fontSize, lineHeight: pitch }),
      textAlign: 'center',
      color,
      ...(strike ? { textDecorationLine: 'line-through' as const } : null),
      ...(segment.status !== 'ok' && row === 'correct' ? { fontWeight: '700' as const } : null),
    },
    mark: {
      position: 'absolute',
      start: 0,
      end: 0,
      top: baseline + pageSurface.markOffset,
      height: 2,
      backgroundColor: color,
      ...(underline === 'dashed'
        ? { borderStyle: 'dashed' as const, borderTopWidth: 2, borderColor: color, height: 0, backgroundColor: 'transparent' }
        : null),
    },
  });

  return (
    <View
      style={styles.cell}
      // The announcement is the accessible representation; a screen-reader user
      // swiping through nine letter cells would be worse than useless.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`diff-cell-${row}-${column.index}`}
    >
      {wash !== null ? <View style={styles.washLayer} /> : null}
      {wash !== null ? <View style={styles.ruleRepaint} /> : null}
      {/* Text selection is enabled: users copy the correct spelling off the strip. */}
      <Text selectable style={styles.text}>
        {glyph}
      </Text>
      {underline !== null ? <View style={styles.mark} /> : null}
      {ownsRibbon ? (
        <Ribbon width={width} baseline={baseline} fontSize={fontSize} color={color} />
      ) : null}
      {/* pairPosition is derived from pairId, never adjacency; kept on the DOM
          for tests and for future per-half treatment. */}
      {pairPosition === null ? null : <View testID={`diff-pair-${pairPosition}-${column.index}`} />}
    </View>
  );
}

/**
 * Decide what glyph a cell shows, in what colour, and whether it is struck.
 *
 * @param segment The segment to render.
 * @param row Which row is being rendered.
 * @param isSpace Whether this cell represents a space character.
 * @param colors The active theme colours.
 * @returns The glyph, its colour, and whether to strike it through.
 */
function resolveGlyph(
  segment: DiffSegment,
  row: 'attempt' | 'correct',
  isSpace: boolean,
  colors: AppTheme['colors'],
): { glyph: string; color: string; strike: boolean } {
  const { diff, page } = colors;

  if (segment.status === 'ok') {
    return { glyph: segment.char, color: page.ink, strike: false };
  }

  if (row === 'attempt') {
    switch (segment.status) {
      case 'missing':
        // Nothing was typed here: the caret is the insertion mark.
        return { glyph: CARET_MARK, color: diff.missing, strike: false };
      case 'wrong':
        return { glyph: segment.typed ?? '', color: diff.wrong, strike: true };
      case 'extra':
        return { glyph: isSpace ? SPACE_MARK : (segment.typed ?? ''), color: diff.extra, strike: true };
      case 'transposed':
        // The two letters AS TYPED, and deliberately NOT struck — the only
        // status that is marked without being struck.
        return { glyph: segment.typed ?? '', color: diff.transposed, strike: false };
      default:
        return { glyph: '', color: page.ink, strike: false };
    }
  }

  switch (segment.status) {
    case 'missing':
      // A space error must occupy a full cell with a VISIBLE glyph. This is the
      // single easiest requirement in the project to lose in a rewrite.
      return { glyph: isSpace ? SPACE_MARK : segment.char, color: diff.missing, strike: false };
    case 'wrong':
      return { glyph: segment.char, color: diff.wrong, strike: false };
    case 'extra':
      // The only status whose correct row contains no letter at all.
      return { glyph: VOID_MARK, color: diff.void, strike: false };
    case 'transposed':
      return { glyph: segment.char, color: diff.transposed, strike: false };
    default:
      return { glyph: segment.char, color: page.ink, strike: false };
  }
}

/**
 * The cell wash behind a marked column, or null for `ok`.
 *
 * Washes are intentionally sub-threshold (1.14–1.23:1): a peripheral "something
 * happened here" cue for scanning, never the signal.
 *
 * @param status The segment's status.
 * @param colors The active theme colours.
 * @returns The wash colour, or null.
 */
function resolveWash(status: DiffSegment['status'], colors: AppTheme['colors']): string | null {
  switch (status) {
    case 'missing':
      return colors.diff.missingContainer;
    case 'extra':
    case 'transposed':
      return colors.diff.wrongContainer;
    default:
      return null;
  }
}

/**
 * The mark shape under a cell in the correct row.
 *
 * Shape is what carries the meaning when colour cannot: solid for `wrong`,
 * dashed for `missing`, none for `extra` (the void cell is its own signal) and
 * none for `transposed` (the ribbon is).
 *
 * @param status The segment's status.
 * @returns The underline style, or null when the status has no underline.
 */
function resolveUnderline(status: DiffSegment['status']): 'solid' | 'dashed' | null {
  if (status === 'wrong') return 'solid';
  if (status === 'missing') return 'dashed';
  return null;
}

/** Props for the {@link Ribbon}. */
interface RibbonProps {
  width: number;
  baseline: number;
  fontSize: number;
  color: string;
}

/**
 * The proofreader's transpose mark: an S-curve looping **over** the first
 * character and **under** the second.
 *
 * Drawn once per pair, owned by the pair's first cell and overflowing into the
 * second, so a single stroke spans two cells rather than two half-strokes
 * meeting at a seam. The stroke is monotonic top-left to bottom-right, so it is
 * never horizontal for any meaningful length and can never shadow a writing
 * rule; it meets the rule at one point, travelling steeply.
 *
 * @param props See {@link RibbonProps}.
 * @returns The ribbon stroke.
 */
function Ribbon({ width, baseline, fontSize, color }: RibbonProps): React.JSX.Element {
  const w = width;
  const yTop = baseline - 1.15 * fontSize + 2; // above cap height
  const yMid = baseline - 0.36 * fontSize; // the cell join
  const yBottom = baseline + 0.22 * fontSize; // the mark band

  const d = [
    `M 0,${yTop}`,
    `C ${0.7 * w},${yTop} ${0.5 * w},${yMid} ${w},${yMid}`,
    `C ${1.5 * w},${yMid} ${1.3 * w},${yBottom} ${2 * w},${yBottom}`,
  ].join(' ');

  return (
    <View
      style={{ position: 'absolute', start: 0, top: 0, width: w * 2, height: baseline + fontSize }}
      pointerEvents="none"
      accessibilityElementsHidden
      testID="diff-ribbon"
    >
      <Svg width={w * 2} height={baseline + fontSize}>
        <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
