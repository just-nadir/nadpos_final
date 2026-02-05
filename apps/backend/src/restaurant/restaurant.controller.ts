import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RestaurantService } from './restaurant.service';

@Controller('restaurants')
@UseGuards(AuthGuard('jwt'))
export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) { }

    private ensureSuperAdmin(req: { user?: { role?: string } }) {
        if (req.user?.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Faqat super-admin uchun');
        }
    }

    @Get()
    findAll(@Req() req: { user?: { role?: string } }) {
        this.ensureSuperAdmin(req);
        return this.restaurantService.findAll();
    }

    @Post()
    create(@Body() data: any, @Req() req: { user?: { role?: string } }) {
        this.ensureSuperAdmin(req);
        return this.restaurantService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any, @Req() req: { user?: { role?: string } }) {
        this.ensureSuperAdmin(req);
        return this.restaurantService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: { user?: { role?: string } }) {
        this.ensureSuperAdmin(req);
        return this.restaurantService.remove(id);
    }
}
