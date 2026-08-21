import { describe, expect, it } from 'vitest';
import { resolveDeveloperToolsEnabled } from '../src/config/developer-tools';

describe('developer tools build gate', () => {
  it('is disabled for a normal production build', () => {
    expect(resolveDeveloperToolsEnabled(false, undefined)).toBe(false);
    expect(resolveDeveloperToolsEnabled(false, 'false')).toBe(false);
  });

  it('can be enabled by dev mode or an explicit flag', () => {
    expect(resolveDeveloperToolsEnabled(true, undefined)).toBe(true);
    expect(resolveDeveloperToolsEnabled(false, 'true')).toBe(true);
  });
});
