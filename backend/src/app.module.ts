import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CompaniesModule } from './companies/companies.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { RatingsModule } from './ratings/ratings.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    CompaniesModule,
    NotificationModule,
    AdminModule,
    AiModule,
    RatingsModule,
    StorageModule,
  ],
})
export class AppModule {}
