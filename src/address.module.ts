import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

@Module({
  imports: [],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
