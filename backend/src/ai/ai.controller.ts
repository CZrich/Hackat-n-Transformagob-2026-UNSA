import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('simulate-interview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EGRESADO')
  async simulateInterview(@Body() body: { jobId: string }, @Req() req: any) {
    return this.aiService.simulateInterview(body.jobId, req.user.sub);
  }
}
