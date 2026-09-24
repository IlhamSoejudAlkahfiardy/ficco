import { Company } from '../schema';
import { BaseRepository } from './base-repository';
import { db } from '../db';
import { handleDbError } from '../errors';

export class CompanyRepository extends BaseRepository<Company, string> {
  constructor() {
    super(db.companies, 'Company');
  }

  async getPrimaryCompany(): Promise<Company | undefined> {
    try {
      // Primary business profile is the first company record
      return await this.table.toCollection().first();
    } catch (err) {
      handleDbError(err, 'CompanyRepository.getPrimaryCompany');
    }
  }

  async savePrimaryCompany(company: Company): Promise<void> {
    try {
      const existing = await this.getPrimaryCompany();
      if (existing) {
        await this.update(existing.id, { ...company, updatedAt: new Date().toISOString() });
      } else {
        await this.create(company);
      }
    } catch (err) {
      handleDbError(err, 'CompanyRepository.savePrimaryCompany');
    }
  }
}

export const companyRepository = new CompanyRepository();
