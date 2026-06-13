import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from '../services/jobs.service';
import { CompanyService } from '../services/company.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [JobsController],
  providers: [JobsService, CompanyService],
  exports: [JobsService],
})
export class JobsModule {}
