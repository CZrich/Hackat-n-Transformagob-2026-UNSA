import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CompanyService } from '../services/company.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: { ruc: string; name: string; rubro: string }, @Req() req: any) {
    return this.companyService.create({ ...body, userId: req.user.sub });
  }
}
