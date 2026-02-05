
import { IsArray, IsNotEmpty, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SyncItemDto {
    @IsString()
    @IsNotEmpty()
    id: string; // The UUID of the record

    @IsString()
    @IsNotEmpty()
    action: string; // CREATE, UPDATE, DELETE

    @IsString()
    @IsNotEmpty()
    dataType: string; // orders, products, etc.

    @IsObject()
    payload: any; // The actual data
}

export class PushSyncDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncItemDto)
    items: SyncItemDto[];
}
