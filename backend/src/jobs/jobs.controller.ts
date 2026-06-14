import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from '../services/jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserRole, ApplicationStatus } from '../common/types';

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
    return this.jobsService.findMatched(req.user.sub);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async getMyApplications(@Req() req: any) {
    return this.jobsService.findMyApplications(req.user.sub);
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

  @Patch(':id/employer-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLEADOR')
  async updateEmployerJobStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    return this.jobsService.updateEmployerJobStatus(id, body.status as any, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLEADOR')
  async deleteJob(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.deleteJob(id, req.user.sub);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async apply(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.applyJob(id, req.user.sub);
  }

  @Patch('applications/:applicationId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLEADOR')
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body() body: { status: ApplicationStatus },
    @Req() req: any,
  ) {
    return this.jobsService.updateApplicationStatus(applicationId, body.status, req.user.sub);
  }

  @Get(':id/match-detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async getMatchDetail(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.getMatchDetail(id, req.user.sub);
  }
}
