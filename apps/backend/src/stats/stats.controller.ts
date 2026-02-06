import { Controller, Get, Query, Param, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('super-admin')
    @UseGuards(AuthGuard('jwt'))
    async getSuperAdminStats(@Req() req: { user?: { role?: string } }) {
        if (req.user?.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Faqat super-admin uchun');
        }
        return this.statsService.getSuperAdminStats();
    }

    @Get('restaurant/sales')
    @UseGuards(AuthGuard('jwt'))
    async getRestaurantSales(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
        const user = (req as any).user;
        if (user?.role !== 'RESTAURANT' || !user?.id) throw new ForbiddenException('Restaurant only');
        const today = new Date().toISOString().slice(0, 10);
        const start = (startDate && String(startDate).trim()) || today;
        const end = (endDate && String(endDate).trim()) || today;
        return this.statsService.getRestaurantSales(user.id, start, end);
    }

    @Get('restaurant/trend')
    @UseGuards(AuthGuard('jwt'))
    async getRestaurantTrend(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
        const user = (req as any).user;
        if (user?.role !== 'RESTAURANT' || !user?.id) throw new ForbiddenException('Restaurant only');
        const today = new Date().toISOString().slice(0, 10);
        const start = (startDate && String(startDate).trim()) || today;
        const end = (endDate && String(endDate).trim()) || today;
        return this.statsService.getRestaurantTrend(user.id, start, end);
    }

    @Get('restaurant/shifts')
    @UseGuards(AuthGuard('jwt'))
    async getRestaurantShifts(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
        const user = (req as any).user;
        if (user?.role !== 'RESTAURANT' || !user?.id) throw new ForbiddenException('Restaurant only');
        const today = new Date().toISOString().slice(0, 10);
        const start = (startDate && String(startDate).trim()) || today;
        const end = (endDate && String(endDate).trim()) || today;
        return this.statsService.getRestaurantShifts(user.id, start, end);
    }

    @Get('restaurant/shifts/:id/sales')
    @UseGuards(AuthGuard('jwt'))
    async getRestaurantShiftSales(@Param('id') id: string, @Req() req: any) {
        const user = (req as any).user;
        if (user?.role !== 'RESTAURANT' || !user?.id) throw new ForbiddenException('Restaurant only');
        return this.statsService.getRestaurantShiftSales(user.id, id);
    }

    @Get('restaurant/cancelled')
    @UseGuards(AuthGuard('jwt'))
    async getRestaurantCancelled(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
        const user = (req as any).user;
        if (user?.role !== 'RESTAURANT' || !user?.id) throw new ForbiddenException('Restaurant only');
        const today = new Date().toISOString().slice(0, 10);
        const start = (startDate && String(startDate).trim()) || today;
        const end = (endDate && String(endDate).trim()) || today;
        return this.statsService.getRestaurantCancelled(user.id, start, end);
    }
}
