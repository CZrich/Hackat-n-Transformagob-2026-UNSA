import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: { ruc: string; name: string; rubro: string }) {
    return this.companiesService.create(body);
  }
}
