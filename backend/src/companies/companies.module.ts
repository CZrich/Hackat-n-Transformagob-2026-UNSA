import { Module } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { CompaniesController } from './companies.controller';

@Module({
  controllers: [CompaniesController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompaniesModule {}
