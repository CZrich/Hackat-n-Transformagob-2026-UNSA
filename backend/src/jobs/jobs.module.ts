import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CompaniesModule } from '../companies/companies.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CompaniesModule, NotificationModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
