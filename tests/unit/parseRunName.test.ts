import { describe, it, expect } from 'vitest';
import { parseRunName } from '../../src/server/testrail/parseRunName';

describe('parseRunName', () => {
  it('parses the canonical "AE - <config>-<YYYYMMDD>" form', () => {
    expect(parseRunName('AE - jahia-8.2-mariadb-tomcat-20260427')).toEqual({
      configName: 'jahia-8.2-mariadb-tomcat',
      date: '20260427',
    });
  });

  it('parses "AE - <config> - <YYYY-MM-DD>" with extra spaces', () => {
    expect(parseRunName('AE - jahia-8.2-mariadb - 2026-04-27')).toEqual({
      configName: 'jahia-8.2-mariadb',
      date: '2026-04-27',
    });
  });

  it('handles underscore separators around the date', () => {
    expect(parseRunName('AE - jahia-8.2-mariadb_20260427')).toEqual({
      configName: 'jahia-8.2-mariadb',
      date: '20260427',
    });
  });

  it('handles dot-separated dates', () => {
    expect(parseRunName('AE - jahia-postgres-2026.04.27')).toEqual({
      configName: 'jahia-postgres',
      date: '2026.04.27',
    });
  });

  it('keeps embedded years inside the config name', () => {
    expect(parseRunName('AE - jahia-2025-bugfix-mariadb-20260427')).toEqual({
      configName: 'jahia-2025-bugfix-mariadb',
      date: '20260427',
    });
  });

  it('groups two runs of the same config on different days under the same name', () => {
    const a = parseRunName('AE - jahia-8.2-mariadb-tomcat-20260427');
    const b = parseRunName('AE - jahia-8.2-mariadb-tomcat-20260428');
    expect(a.configName).toBe(b.configName);
    expect(a.date).not.toBe(b.date);
  });

  it('is tolerant of casing and missing spaces in the AE prefix', () => {
    expect(parseRunName('ae-jahia-postgres-20260427').configName).toBe('jahia-postgres');
    expect(parseRunName('AE_jahia-postgres-20260427').configName).toBe('jahia-postgres');
  });

  it('falls back to the full name when the format is unexpected', () => {
    expect(parseRunName('Manual smoke run')).toEqual({
      configName: 'Manual smoke run',
      date: '',
    });
  });

  it('strips a trailing date even when the AE prefix is missing', () => {
    expect(parseRunName('jahia-postgres-20260427')).toEqual({
      configName: 'jahia-postgres',
      date: '20260427',
    });
  });

  it('handles empty input safely', () => {
    expect(parseRunName('')).toEqual({ configName: '', date: '' });
    expect(parseRunName('   ')).toEqual({ configName: '', date: '' });
  });

  it('strips a trailing time and named timezone', () => {
    expect(parseRunName('AE - Jahia EE-2026-04-28 17:32:16 GMT+02:00 (CEST)')).toEqual({
      configName: 'Jahia EE',
      date: '2026-04-28',
    });
  });

  it('strips a trailing date+time without a timezone', () => {
    expect(parseRunName('AE - Jahia EE 2026-04-28 17:32')).toEqual({
      configName: 'Jahia EE',
      date: '2026-04-28',
    });
  });

  it('strips an ISO timestamp with Z', () => {
    expect(parseRunName('AE - jahia-postgres-2026-04-28T17:32:16Z')).toEqual({
      configName: 'jahia-postgres',
      date: '2026-04-28',
    });
  });

  it('groups multiple Jahia EE runs from the same day under a single config', () => {
    const names = [
      'AE - Jahia EE-2026-04-28 17:32:16 GMT+02:00 (CEST)',
      'AE - Jahia EE-2026-04-28 16:56:00 GMT+02:00 (CEST)',
      'AE - Jahia EE-2026-04-28 13:25:04 GMT+02:00 (CEST)',
    ];
    const configs = new Set(names.map((n) => parseRunName(n).configName));
    expect(configs.size).toBe(1);
    expect([...configs][0]).toBe('Jahia EE');
  });
});
