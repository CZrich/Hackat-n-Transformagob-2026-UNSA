import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersModule } from '../users/users.module';
import { config } from '../config';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      privateKey: config.jwt.privateKey,
      publicKey: config.jwt.publicKey,
      signOptions: { expiresIn: config.jwt.expiration, algorithm: 'RS256' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
