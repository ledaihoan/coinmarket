import { Module, CacheModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {HttpModule} from '@nestjs/axios';
import {ScheduleModule} from "@nestjs/schedule";

@Module({
  imports: [CacheModule.register(), ScheduleModule.forRoot(), ConfigModule.forRoot(), HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
