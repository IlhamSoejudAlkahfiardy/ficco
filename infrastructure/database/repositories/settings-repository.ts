import { AppSetting } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class SettingsRepository extends BaseRepository<AppSetting, string> {
  constructor() {
    super(db.settings, 'Setting');
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const setting = await this.getById(key);
      if (!setting || setting.value === undefined) {
        return defaultValue;
      }
      return setting.value as T;
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
