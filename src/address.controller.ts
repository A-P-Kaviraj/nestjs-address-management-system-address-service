import { Controller, Post, Body } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('add')
  async addAddress(@Body() addAddressDto: { userId: number; address: string }) {
    const { userId, address } = addAddressDto;
    return await this.addressService.addAddress(userId, address);
  }
}
