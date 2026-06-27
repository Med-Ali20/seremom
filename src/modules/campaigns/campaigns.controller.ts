import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { SesService } from '../email/ses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
 
@Controller('newsletter/campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly prisma: PrismaService,
    private readonly sesService: SesService,
  ) {}

  @Get()
  list() { //
    return this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // EmailComposer.handleSaveDraft posts { ...form, status: 'DRAFT' }
  // EmailComposer.handleSend posts { ...form } (no status) -> create + queue
  @Post()
  async create(@Body() body: any) {
    const campaign = await this.campaigns.createDraft(body);
    if (body.status !== 'DRAFT') {
      console.log('Queueing campaign...');
      await this.campaigns.queueCampaign(campaign.id);
      console.log('Campaign queued');
    }
    return { campaign };
  }

  // EmailComposer.handleSendTest posts { email } here after creating a draft
  @Post(':id/test')
  sendTest(@Param('id') id: string, @Body('email') email: string) {
    return this.campaigns.sendTest(id, email);
  }

  @Post('test-ses')
  async test() {
    console.log({
      configSet: process.env.SES_CONFIGURATION_SET,
      region: process.env.AWS_REGION,
    });
    const messageId = await this.sesService.send({
      to: 'thunderstruck772@gmail.com',
      subject: 'SES Test',
      html: '<h1>Hello from SES!</h1>',
      fromName: 'Seremom',
    });

    return { messageId };
  }

  @Get('stats')
  async stats() {
    const [total, active] = await Promise.all([
      this.prisma.subscriber.count(),
      this.prisma.subscriber.count({ where: { status: 'ACTIVE' } }),
    ]);

    return { subscribers: total, active, openRate: 0 };
  }
}
