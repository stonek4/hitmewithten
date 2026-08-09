/**
 * CAP-8 pure-parsing tests.
 *
 * Everything here is untrusted input from a nine-year-old app, so the tests
 * lean hard on malformed and hostile shapes.
 */

import {
  legacyCardsKey,
  parseLegacyCards,
  parseLegacyCurrent,
  parseLegacyKeys,
  parseLegacyTrophiesJson,
  setNameFromFilename,
} from './logic';

/** The exact example from REBUILD_SPEC §6. */
const REAL_FILE = JSON.stringify([
  { definitions: ['Extremely hungry'], answers: ['ravenous'] },
  { definitions: ['To speak in favor of'], answers: ['advocate'] },
]);

describe('CAP-8 — setNameFromFilename', () => {
  it('takes the set name from the filename minus .cards', () => {
    expect(setNameFromFilename('SAT Words.cards')).toBe('SAT Words');
  });

  it('keeps spaces and non-ASCII, which the legacy app allowed verbatim', () => {
    expect(setNameFromFilename('Español 101.cards')).toBe('Español 101');
  });

  it('accepts a renamed download rather than losing the user’s data', () => {
    expect(setNameFromFilename('SAT Words.cards.txt')).toBe('SAT Words.cards.txt');
    expect(setNameFromFilename('SAT Words')).toBe('SAT Words');
  });

  it('is case-insensitive about the extension', () => {
    expect(setNameFromFilename('SAT Words.CARDS')).toBe('SAT Words');
  });

  it('strips any path so a picker cannot smuggle directories into a name', () => {
    expect(setNameFromFilename('/storage/emulated/0/Download/SAT Words.cards')).toBe('SAT Words');
    expect(setNameFromFilename('C:\\Users\\kevin\\SAT Words.cards')).toBe('SAT Words');
  });

  it('caps the length and reports an empty name for the caller to reject', () => {
    expect(setNameFromFilename(`${'a'.repeat(300)}.cards`)).toHaveLength(100);
    expect(setNameFromFilename('.cards')).toBe('');
    expect(setNameFromFilename('   .cards')).toBe('');
  });
});

describe('CAP-8 — parseLegacyCards', () => {
  it('reads the real legacy format', () => {
    const result = parseLegacyCards(REAL_FILE);
    expect(result).toEqual({
      ok: true,
      value: {
        dropped: 0,
        cards: [
          { definitions: ['Extremely hungry'], answers: ['ravenous'] },
          { definitions: ['To speak in favor of'], answers: ['advocate'] },
        ],
      },
    });
  });

  it('accepts arrays longer than one, which the format allows but the app never wrote', () => {
    const result = parseLegacyCards(
      JSON.stringify([{ definitions: ['a', 'b'], answers: ['colour', 'color'] }]),
    );
    expect(result.ok && result.value.cards[0]).toEqual({
      definitions: ['a', 'b'],
      answers: ['colour', 'color'],
    });
  });

  it('preserves internal whitespace byte-exactly and trims only the ends', () => {
    const result = parseLegacyCards(
      JSON.stringify([{ definitions: ['  A frozen  dessert '], answers: [' ice cream '] }]),
    );
    expect(result.ok && result.value.cards[0]).toEqual({
      definitions: ['A frozen  dessert'],
      answers: ['ice cream'],
    });
  });

  it('drops individually unusable cards instead of failing the whole file', () => {
    // A returning user is far better served by the readable cards than an error.
    const result = parseLegacyCards(
      JSON.stringify([
        { definitions: ['good'], answers: ['card'] },
        { definitions: [], answers: ['orphan'] },
        { definitions: ['orphan'], answers: ['   '] },
        { definitions: 'not an array', answers: ['x'] },
        null,
        42,
      ]),
    );
    expect(result.ok && result.value.cards).toHaveLength(1);
    expect(result.ok && result.value.dropped).toBe(5);
  });

  it('names the reason when nothing usable is left', () => {
    expect(parseLegacyCards('[]')).toEqual({ ok: false, reasonKey: 'import.reason.noUsableCards' });
    expect(parseLegacyCards(JSON.stringify([{ definitions: [], answers: [] }]))).toEqual({
      ok: false,
      reasonKey: 'import.reason.noUsableCards',
    });
  });

  it('names the reason for a file that is not JSON, not an array, or empty', () => {
    expect(parseLegacyCards('{ not json')).toEqual({ ok: false, reasonKey: 'import.reason.notJson' });
    expect(parseLegacyCards('{"a":1}')).toEqual({
      ok: false,
      reasonKey: 'import.reason.notAnArray',
    });
    expect(parseLegacyCards('   ')).toEqual({ ok: false, reasonKey: 'import.reason.empty' });
  });

  it('treats markup and script as inert text, never as anything to interpret', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const result = parseLegacyCards(
      JSON.stringify([{ definitions: [hostile], answers: ['<script>alert(1)</script>'] }]),
    );
    // It survives as ordinary card text — which is exactly right. Nothing in
    // the rebuild ever interprets a card string as markup, which is what closes
    // the legacy stored-XSS by construction.
    expect(result.ok && result.value.cards[0].definitions[0]).toBe(hostile);
  });

  it('caps an absurdly long entry at the authoring limit', () => {
    const result = parseLegacyCards(
      JSON.stringify([{ definitions: ['x'.repeat(5000)], answers: ['y'.repeat(5000)] }]),
    );
    expect(result.ok && result.value.cards[0].answers[0]).toHaveLength(256);
  });

  it('never throws, whatever it is handed', () => {
    for (const text of ['', 'null', 'true', '"a string"', '[[[', '{]', '\u0000']) {
      expect(() => parseLegacyCards(text)).not.toThrow();
    }
  });
});

describe('CAP-8 — parseLegacyKeys', () => {
  it('reads the set-name list', () => {
    expect(parseLegacyKeys('["Spanish 101","SAT Words"]')).toEqual(['Spanish 101', 'SAT Words']);
  });

  it('de-duplicates and drops blanks', () => {
    expect(parseLegacyKeys('["A","A","  ",""]')).toEqual(['A']);
  });

  it('yields nothing rather than throwing on a broken value', () => {
    for (const raw of [null, 'not json', '{"a":1}', '[1,2,3]', '"a"']) {
      expect(parseLegacyKeys(raw)).toEqual([]);
    }
  });
});

describe('CAP-8 — parseLegacyCurrent', () => {
  it('reads a real selection', () => {
    expect(parseLegacyCurrent('SAT Words')).toBe('SAT Words');
  });

  it('treats the LITERAL STRING "null" as no selection', () => {
    // The legacy app calls setItem('current', null), storing four characters.
    expect(parseLegacyCurrent('null')).toBeNull();
    expect(parseLegacyCurrent('undefined')).toBeNull();
    expect(parseLegacyCurrent('   ')).toBeNull();
    expect(parseLegacyCurrent(null)).toBeNull();
  });

  it('does not trim a real name, which the legacy app stored verbatim', () => {
    expect(parseLegacyCurrent(' Spaced ')).toBe(' Spaced ');
  });
});

describe('CAP-8 — legacy key shapes', () => {
  it('builds the cards key exactly as the legacy app did', () => {
    expect(legacyCardsKey('SAT Words')).toBe('SAT Words.cards');
  });

  it('parses the trophies value, or reports nothing readable', () => {
    expect(parseLegacyTrophiesJson('[{"type":"CardsTestedTrophy"}]')).toEqual([
      { type: 'CardsTestedTrophy' },
    ]);
    expect(parseLegacyTrophiesJson('broken')).toBeNull();
    expect(parseLegacyTrophiesJson(null)).toBeNull();
  });
});
