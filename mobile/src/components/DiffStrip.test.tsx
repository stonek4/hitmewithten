/**
 * CAP-5 component tests.
 *
 * These pin the behaviours that are easiest to lose silently in a rewrite: the
 * visible space marker, the correct answer staying fully readable, the
 * transposed pair being one mark rather than two, and the announcement being
 * polite rather than assertive.
 */

import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { computeSpellingDiff } from '@/features/evaluation/logic';
import { initI18n } from '@/i18n';
import { lightTheme } from '@/theme';

import { DiffStrip } from './DiffStrip';

initI18n();

/**
 * Query options for the *visual* assertions below.
 *
 * Every diff cell carries `accessibilityElementsHidden` on purpose — the strip's
 * own announcement is the accessible representation, and a screen-reader user
 * swiping through nine letter cells would be worse than useless. RNTL hides
 * such elements from queries by default, so assertions about what is *painted*
 * must opt back in. (If these ever start passing without this flag, the cells
 * have stopped being hidden and the a11y contract has regressed.)
 */
const VISUAL = { includeHiddenElements: true } as const;

/**
 * Render a diff strip for one (typed, correct) pair inside the app theme.
 *
 * @param typed What the user submitted.
 * @param correct The accepted answer.
 * @param showAttempt Whether to render the attempt row.
 * @returns Nothing; assertions read from `screen`.
 */
function renderDiff(typed: string, correct: string, showAttempt = true): void {
  render(
    <PaperProvider theme={lightTheme}>
      <DiffStrip
        diff={computeSpellingDiff(typed, correct)}
        typedRaw={typed}
        showAttempt={showAttempt}
        testID="strip"
      />
    </PaperProvider>,
  );
}

describe('CAP-5 — the correct spelling is always fully readable', () => {
  it('renders every character of the answer, marked or not', () => {
    renderDiff('ravenus', 'ravenous');
    for (const char of ['r', 'a', 'v', 'e', 'n', 'o', 'u', 's']) {
      expect(screen.getAllByText(char, VISUAL).length).toBeGreaterThan(0);
    }
  });
});

describe('CAP-5 — a space error is NEVER rendered as literal whitespace', () => {
  it('shows the proofreader’s # insert-a-space mark for a missing space', () => {
    // The single easiest requirement in the project to lose in a rewrite, and
    // a feature no competitor has.
    renderDiff('icecream', 'ice cream');
    expect(screen.getAllByText('#', VISUAL).length).toBeGreaterThan(0);
  });

  it('shows a # in the attempt row for a surplus space too', () => {
    renderDiff('ice  cream', 'ice cream');
    expect(screen.getAllByText('#', VISUAL).length).toBeGreaterThan(0);
  });
});

describe('CAP-5 — the five kinds carry non-colour signals', () => {
  it('shows an insertion caret in the attempt row for a missing letter', () => {
    renderDiff('ravenus', 'ravenous');
    expect(screen.getAllByText('∧', VISUAL).length).toBeGreaterThan(0);
  });

  it('shows a void mark — a cell with no letter — for an extra character', () => {
    renderDiff('ravenious', 'ravenous');
    expect(screen.getAllByText('·', VISUAL).length).toBeGreaterThan(0);
  });
});

describe('CAP-5 — a transposed pair reads as ONE error', () => {
  it('draws exactly one ribbon per swap, not one per marked cell', () => {
    renderDiff('recieve', 'receive');
    // Two rows × one pair = two ribbons (one per row), never four.
    expect(screen.getAllByTestId('diff-ribbon', VISUAL)).toHaveLength(2);
  });

  it('draws TWO ribbons per row for a double swap, grouped by pairId', () => {
    // Four consecutive transposed segments that adjacency alone cannot split.
    renderDiff('badc', 'abcd');
    expect(screen.getAllByTestId('diff-ribbon', VISUAL)).toHaveLength(4);
  });
});

describe('CAP-5 — the accessible representation', () => {
  it('announces politely, never assertively — it must not interrupt a retry', () => {
    renderDiff('ravenus', 'ravenous');
    expect(screen.getByTestId('strip').props.accessibilityLiveRegion).toBe('polite');
  });

  it('spells the answer letter by letter and names the error', () => {
    renderDiff('ravenus', 'ravenous');
    expect(screen.getByTestId('strip').props.accessibilityLabel).toBe(
      'Incorrect. Correct spelling: r-a-v-e-n-o-u-s. You left out the letter o.',
    );
  });

  it('names a space explicitly when spelling the answer out', () => {
    renderDiff('icecream', 'ice cream');
    expect(screen.getByTestId('strip').props.accessibilityLabel).toBe(
      'Incorrect. Correct spelling: i-c-e, space, c-r-e-a-m. You left out a space.',
    );
  });

  it('reports a swap as ONE error naming both characters', () => {
    renderDiff('recieve', 'receive');
    expect(screen.getByTestId('strip').props.accessibilityLabel).toBe(
      'Incorrect. Correct spelling: r-e-c-e-i-v-e. You swapped the e and the i.',
    );
  });

  it('caps a wildly wrong answer instead of producing a minute of speech', () => {
    renderDiff('xyz', 'ravenous');
    expect(screen.getByTestId('strip').props.accessibilityLabel).toContain('And 5 more errors.');
  });
});

describe('CAP-5 — the attempt row is opt-in (US-D6)', () => {
  it('renders only the correct row at P0', () => {
    renderDiff('ravenus', 'ravenous', false);
    expect(screen.queryByTestId('strip-attempt')).toBeNull();
    expect(screen.getByTestId('strip-correct')).toBeTruthy();
  });
});
