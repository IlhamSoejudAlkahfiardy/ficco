import { AppSetting } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class SettingsRepository extends BaseRepository<AppSetting, string> {
  constructor() {
    super(db.settings, 'Setting');
  }

  /**
   * Retrieves setting value by key, returning undefined if not found.
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const setting = await this.getById(key);
      if (!setting || setting.value === undefined) {
        return undefined;
      }
      return setting.value as T;
    } catch (err) {
      handleDbError(err, `SettingsRepository.get(${key})`);
    }
  }

  /**
   * Alias for setSetting to store key-value pair.
   */
  async set<T>(key: string, value: T): Promise<void> {
    return this.setSetting(key, value);
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await this.get<T>(key);
      return value !== undefined ? value : defaultValue;
    } catch (err) {
      handleDbError(err, `SettingsRepository.getSetting(${key})`);
    }
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    try {
      await this.table.put({
        key,
        value,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleDbError(err, `SettingsRepository.setSetting(${key})`);
    }
  }
}

export const settingsRepository = new SettingsRepository();
