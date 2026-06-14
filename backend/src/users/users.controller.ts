import { Controller, Get, Put, Post, Param, Body, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('profile/cv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadCv(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo no proporcionado');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se aceptan archivos PDF');
    }

    const userId = req.user.sub;
    const filePath = `egresados/${userId}/cv_${Date.now()}.pdf`;

    const publicUrl = await this.storageService.uploadFile(
      filePath,
      file.buffer,
      file.mimetype,
    );

    await this.prisma.graduateProfile.upsert({
      where: { userId },
      update: { cv_name: file.originalname, cv_url: publicUrl },
      create: { userId, cv_name: file.originalname, cv_url: publicUrl, skills: [] },
    });

    return { cv_name: file.originalname, cv_url: publicUrl };
  }

  @Put('graduate-profile')
  @UseGuards(JwtAuthGuard)
  @Roles('EGRESADO')
  async updateGraduateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateGraduateProfile(req.user.sub, body);
  }

  @Get('graduate-profile')
  @UseGuards(JwtAuthGuard)
  @Roles('EGRESADO')
  async getGraduateProfile(@Req() req: any) {
    return this.usersService.getGraduateProfile(req.user.sub);
  }
}
