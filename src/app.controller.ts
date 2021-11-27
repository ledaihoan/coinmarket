import {Controller, Get, Render} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root() {
    return { message: 'Binance Coin Market Data' };
  }
  @Get("/part1")
  @Render('part1')
  async getLatestOrderBookData() {
    const orderBookData = await this.appService.getOrderBookData();
    let bids = [], asks = [];
    let updatedAt = "none";
    if(orderBookData) {
      if(Array.isArray(orderBookData.bids)) {
        bids = [...orderBookData.bids];
      }
      if(Array.isArray(orderBookData.asks)) {
        asks = [...orderBookData.asks];
      }
      updatedAt = orderBookData.updatedAt || "NONE";
    }
    let hasData = bids.length > 0;
    return {bids, asks, hasData, updatedAt};
  }
  @Get('/part2')
  @Render('part2')
  async getLatestLimitedOrderBookData() {
    return await this.appService.getLimitOrderBookData();
  }
}
