import { Controller, Get, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('companies')
  listCompanies() {
    return this.adminService.listCompanies();
  }

  @Patch('companies/:id/verify')
  verifyCompany(@Param('id') id: string, @Body('es_verificada') esVerificada: boolean) {
    return this.adminService.verifyCompany(id, esVerificada);
  }

  @Patch('companies/:id/ban')
  banCompany(@Param('id') id: string, @Body('es_baneada') esBaneada: boolean) {
    return this.adminService.banCompany(id, esBaneada);
  }
}
