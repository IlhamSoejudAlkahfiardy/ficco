import { type Table } from 'dexie';
import { handleDbError, NotFoundError } from '../errors';

export abstract class BaseRepository<T extends object, TKey extends string | number = string> {
  protected table: Table<T, TKey>;
  protected entityName: string;

  constructor(table: Table<T, TKey>, entityName: string) {
    this.table = table;
    this.entityName = entityName;
  }

  async getAll(): Promise<T[]> {
    try {
      return await this.table.toArray();
    } catch (err) {
      handleDbError(err, `${this.entityName}.getAll`);
    }
  }

  async getById(id: TKey): Promise<T | undefined> {
    try {
      return await this.table.get(id);
    } catch (err) {
      handleDbError(err, `${this.entityName}.getById(${id})`);
    }
  }

  async getByIdOrThrow(id: TKey): Promise<T> {
    const item = await this.getById(id);
    if (!item) {
      throw new NotFoundError(this.entityName, id);
    }
    return item;
  }

  async create(entity: T): Promise<TKey> {
    try {
      return await this.table.add(entity);
    } catch (err) {
      handleDbError(err, `${this.entityName}.create`);
    }
  }

  async update(id: TKey, changes: Partial<T>): Promise<number> {
    try {
      // @ts-expect-error Dexie UpdateSpec allows partial object
      const updatedCount = await this.table.update(id, changes);
      if (updatedCount === 0) {
        throw new NotFoundError(this.entityName, id);
      }
      return updatedCount;
    } catch (err) {
      handleDbError(err, `${this.entityName}.update(${id})`);
    }
  }

  async delete(id: TKey): Promise<void> {
    try {
      await this.table.delete(id);
    } catch (err) {
      handleDbError(err, `${this.entityName}.delete(${id})`);
    }
  }

  async bulkCreate(entities: T[]): Promise<TKey[]> {
    try {
      return (await this.table.bulkAdd(entities, { allKeys: true })) as TKey[];
    } catch (err) {
      handleDbError(err, `${this.entityName}.bulkCreate`);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.table.count();
    } catch (err) {
      handleDbError(err, `${this.entityName}.count`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.table.clear();
    } catch (err) {
      handleDbError(err, `${this.entityName}.clear`);
    }
  }
}
