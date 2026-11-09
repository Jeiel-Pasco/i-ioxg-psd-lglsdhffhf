import { describe, expect, it } from 'vitest';
import complete from '../fixtures/entries/complete.json';
import { validateEntries, type Issue } from '../../src/data/validate';
import { loadEntryFiles } from '../../tools/validate-data';

type Raw = Record<string, unknown>;

/** A deep copy of the complete fixture with `patch` applied to the top level. */
function entry(patch: Raw = {}): Raw {
  return { ...structuredClone(complete as Raw), ...patch };
}

function errorsFor(e: Raw): Issue[] {
  return validateEntries([e]).errors;
}

function hasError(e: Raw, pathPart: string): boolean {
  return errorsFor(e).some((i) => i.path.includes(pathPart));
}

describe('validateEntries', () => {
  it('accepts a complete entry with no errors or warnings', () => {
    expect(validateEntries([entry()])).toEqual({ errors: [], warnings: [] });
  });

  it('rejects a TODO field', () => {
    expect(hasError(entry({ summary: 'TODO' }), 'summary')).toBe(true);
  });

  it('rejects an empty field', () => {
    expect(hasError(entry({ hook: '  ' }), 'hook')).toBe(true);
  });

  it('rejects a fact without a source URL', () => {
    const e = entry({ facts: [{ text: 'A fact.', source_url: 'TODO' }, { text: 'B.', source_url: '' }] });
    expect(hasError(e, 'facts.0.source_url')).toBe(true);
    expect(hasError(e, 'facts.1.source_url')).toBe(true);
  });

  it('rejects a source URL that is not an http(s) URL', () => {
    expect(hasError(entry({ facts: [{ text: 'A.', source_url: 'nasa page' }, complete.facts[1]] }), 'facts.0.source_url')).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(hasError(entry({ status: 'abandoned' }), 'status')).toBe(true);
  });

  it.each(['active', 'dormant', 'ended', 'lost', 'drifting'])('accepts status %s', (status) => {
    expect(errorsFor(entry({ status }))).toEqual([]);
  });

  it('rejects writer == verifier', () => {
    expect(hasError(entry({ written_by: 'Sam', verified_by: 'Sam' }), 'verified_by')).toBe(true);
  });

  it('rejects writer == verifier ignoring case and spaces', () => {
    expect(hasError(entry({ written_by: 'Sam Lee', verified_by: ' sam lee ' }), 'verified_by')).toBe(true);
  });

  it('rejects missing writer or verifier (null)', () => {
    expect(hasError(entry({ written_by: null }), 'written_by')).toBe(true);
    expect(hasError(entry({ verified_by: null }), 'verified_by')).toBe(true);
  });

  it('rejects a missing image credit or alt text', () => {
    const e = entry({ image: { ...complete.image, credit: '', alt: 'TODO' } });
    expect(hasError(e, 'image.credit')).toBe(true);
    expect(hasError(e, 'image.alt')).toBe(true);
  });

  it('rejects a missing last_verified', () => {
    expect(hasError(entry({ last_verified: null }), 'last_verified')).toBe(true);
  });

  it('rejects a malformed date', () => {
    expect(hasError(entry({ launch_date: '17 April 1967' }), 'launch_date')).toBe(true);
  });

  it('rejects non-list locations', () => {
    expect(hasError(entry({ locations: complete.locations[0] }), 'locations')).toBe(true);
  });

  it('rejects an empty locations list', () => {
    expect(hasError(entry({ locations: [] }), 'locations')).toBe(true);
  });

  it('rejects lon -225.99', () => {
    expect(hasError(entry({ locations: [{ ...complete.locations[0], lon: -225.99 }] }), 'locations.0.lon')).toBe(true);
  });

  it('rejects lat 112.828', () => {
    expect(hasError(entry({ locations: [{ ...complete.locations[0], lat: 112.828 }] }), 'locations.0.lat')).toBe(true);
  });

  it('rejects duplicate IDs', () => {
    const { errors } = validateEntries([entry(), entry()]);
    expect(errors.some((i) => i.message.includes('duplicate'))).toBe(true);
  });

  it('warns on a non-NASA URL without erroring', () => {
    const e = entry({ image: { ...complete.image, source_url: 'https://example.com/pic' } });
    const { errors, warnings } = validateEntries([e]);
    expect(errors).toEqual([]);
    expect(warnings.map((w) => w.path)).toEqual(['image.source_url']);
  });

  it('does not treat a look-alike host as NASA', () => {
    const e = entry({ image: { ...complete.image, source_url: 'https://notnasa.gov.example.com/x' } });
    expect(validateEntries([e]).warnings).toHaveLength(1);
  });

  it('reports every gap of an entry, tagged with its id', () => {
    const errors = errorsFor(entry({ summary: 'TODO', hook: 'TODO' }));
    expect(errors).toHaveLength(2);
    expect(errors.every((i) => i.id === 'fixture-lander')).toBe(true);
  });
});

describe('data/artifacts stubs', () => {
  const entries = loadEntryFiles('data/artifacts');
  const ids = entries.map((e) => String(e.id));

  it('has all 17 entries: 8 Moon, 9 Mars', () => {
    expect(entries).toHaveLength(17);
    expect(entries.filter((e) => e.world === 'moon')).toHaveLength(8);
    expect(entries.filter((e) => e.world === 'mars')).toHaveLength(9);
  });

  it('has 21 markers', () => {
    const markers = entries.reduce((n, e) => n + (Array.isArray(e.locations) ? e.locations.length : 0), 0);
    expect(markers).toBe(21);
  });

  it('has no structural errors, only content gaps (TODO or human fields)', () => {
    const { errors } = validateEntries(entries);
    const structural = errors.filter((i) => !i.message.startsWith('gap:'));
    expect(structural).toEqual([]);
  });

  it('never fills human fields', () => {
    for (const e of entries) {
      expect(e.verified_by, String(e.id)).toBeNull();
      expect(e.last_verified, String(e.id)).toBeNull();
      expect(e.written_by, String(e.id)).toBeNull();
    }
  });

  it('has unique ids covering the GDD 2.2 list', () => {
    expect(new Set(ids).size).toBe(17);
    expect(ids).toContain('apollo-11-site');
    expect(ids).toContain('perseverance-landing-hardware');
  });
});
