import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ContactDto {
    @IsString()
    @IsNotEmpty({ message: 'Ism kiritilishi shart' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Telefon raqam kiritilishi shart' })
    @MinLength(9, { message: 'Telefon raqam to\'g\'ri emas' })
    phone: string;
}
