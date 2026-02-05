import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurants')
export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) { }

    @Get()
    findAll() {
        return this.restaurantService.findAll();
    }

    @Post()
    create(@Body() data: any) {
        return this.restaurantService.create(data);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.restaurantService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.restaurantService.remove(id);
    }
}
