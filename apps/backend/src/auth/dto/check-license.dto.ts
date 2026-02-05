import { IsNotEmpty, IsString } from 'class-validator';

export class CheckLicenseDto {
    @IsString()
    @IsNotEmpty()
    restaurantId: string;

    @IsString()
    @IsNotEmpty()
    machineId: string;
}
