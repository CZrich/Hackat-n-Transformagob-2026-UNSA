import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserRole } from '../common/types';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLEADOR', 'ADMIN')
  async create(@Body() body: any, @Req() req: any) {
    return this.jobsService.create(body, req.user.sub);
  }

  @Get('match')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async getMatched(@Req() req: any) {
    const { carrera } = req.user;
    return this.jobsService.findByCareer(carrera);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getPending() {
    return this.jobsService.findPending();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLEADOR')
  async getMyJobs(@Req() req: any) {
    return this.jobsService.findByCompanyUser(req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    return this.jobsService.updateStatus(
      id,
      body.status as any,
      req.user.sub,
      req.user.role as UserRole,
    );
  }
}
