import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CompaniesModule } from './companies/companies.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    CompaniesModule,
    NotificationModule,
  ],
})
export class AppModule {}
