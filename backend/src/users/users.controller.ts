import { Controller, Get, Put, Post, Param, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('profile/cv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Basic mock implementation for the hackathon
    // Since we don't have a configured cloud storage, we just take the filename and generate a fake URL,
    // or simulate that it's saved.
    const fakeUrl = `/uploads/${file.originalname}`;
    return this.usersService.updateProfile(req.user.sub, {
      cv_name: file.originalname,
      cv_url: fakeUrl
    });
  }
}
