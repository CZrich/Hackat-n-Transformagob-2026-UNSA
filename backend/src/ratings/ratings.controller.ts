import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async rateCompany(@Body() body: { companyId: string; score: number; comment?: string }, @Req() req: any) {
    return this.ratingsService.rateCompany(body.companyId, req.user.sub, body.score, body.comment);
  }

  @Get('company/:companyId')
  async getCompanyRating(@Param('companyId') companyId: string) {
    return this.ratingsService.getCompanyRating(companyId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async getMyRatings(@Req() req: any) {
    return this.ratingsService.getUserRatings(req.user.sub);
  }
}
