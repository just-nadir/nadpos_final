
import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PushSyncDto } from './dto/push-sync.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post('push')
    async push(@Request() req, @Body() pushSyncDto: PushSyncDto) {
        // req.user comes from JwtStrategy
        const restaurantId = req.user.id;
        return this.syncService.pushData(restaurantId, pushSyncDto);
    }
}
