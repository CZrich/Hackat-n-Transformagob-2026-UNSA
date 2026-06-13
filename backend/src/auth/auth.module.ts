import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { config } from '../config';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: config.jwt.secret,
      signOptions: { expiresIn: config.jwt.expiration },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
