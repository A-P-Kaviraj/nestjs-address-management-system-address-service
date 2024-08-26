import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { promises as fs } from 'fs';
import * as path from 'path';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AddressService {
  private userClient: ClientProxy;
  private emailClient: ClientProxy;
  private readonly addressFile = path.join(
    __dirname,
    '..',
    'data',
    'addresses.json',
  );

  constructor() {
    this.userClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'user_queue',
        queueOptions: {
          durable: false,
        },
      },
    });

    this.emailClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'email_queue',
        queueOptions: {
          durable: false,
        },
      },
    });
  }

  private async readAddresses(): Promise<any[]> {
    try {
      const content = await fs.readFile(this.addressFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading addresses file:', error);
      return [];
    }
  }

  private async writeAddresses(addresses: any[]): Promise<void> {
    try {
      const data = JSON.stringify(addresses, null, 2);
      await fs.writeFile(this.addressFile, data, 'utf8');
      console.log('Addresses successfully written to file');
    } catch (error) {
      console.error('Error writing addresses file:', error);
    }
  }

  async addAddress(userId: number, address: string) {
    try {
      const user = await lastValueFrom(
        this.userClient.send({ cmd: 'get_user' }, { id: userId }),
      );

      if (!user) {
        throw new Error('User not found');
      }

      const newAddress = {
        userId: user.id,
        name: user.name,
        address: address,
        email: user.email,
      };

      const addresses = await this.readAddresses();
      addresses.push(newAddress);
      await this.writeAddresses(addresses);

      this.emailClient.emit(
        { cmd: 'send_email' },
        {
          email: user.email,
          message: `Hi ${user.name}, your address has been added successfully 😁`,
        },
      );

      return { status: 'Address added successfully and email sent' };
    } catch (error) {
      console.error('Error adding address:', error.message);
      throw new Error('Failed to add address');
    }
  }
}
