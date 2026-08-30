import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { TypesConfigService } from '../../../config/config.types';

@Injectable()
export class MongoService implements OnModuleDestroy {
  private readonly client: MongoClient;
  readonly db: Db;

  constructor(private readonly config: TypesConfigService) {
    const uri = config.getOrThrow<string>('MONGO_URI');
    const dbName = config.getOrThrow<string>('MONGO_DB_NAME');

    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
  }

  async init() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
