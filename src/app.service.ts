import {CACHE_MANAGER, Inject, Injectable, Logger} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {map, Observable} from "rxjs";
import {AxiosResponse} from "axios";
import {OrderBook} from "./OrderBook";
import {Cron, CronExpression} from "@nestjs/schedule";
import {Cache} from "cache-manager";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private httpService: HttpService, @Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getLatestOrderBookFromMarket() {
    const headersRequest = {
      'Content-Type': 'application/json', // afaik this one is not needed
      'X-MBX-APIKEY': `${process.env.apiKey}`,
    };

    const res = await this.httpService.get('https://api.binance.com/api/v3/depth?symbol=ETHBTC', {
      headers: headersRequest
    }).pipe(map(response => response.data));
    let data = await res.toPromise();
    console.log(data);
    return data;
  }
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Called every 30 seconds');
    const orderBookData = await this.getLatestOrderBookFromMarket();
    await this.cacheManager.set("part1", orderBookData, {ttl: 40});
    await this.cacheManager.set("part1UpdatedAt", new Date().toLocaleString(), {ttl: 40});
  }

  async getOrderBookData() {
    let orderBookData;
    try {
      orderBookData = Object.assign({}, await this.cacheManager.get("part1"));
      orderBookData.updatedAt = await this.cacheManager.get("part1UpdatedAt");
    } catch (e) {
      this.logger.debug("GET ORDER BOOK DATA from CACHE", e.messsage);
    }
    if(!orderBookData) {
      let self = this;
      setTimeout(() => {
        self.handleCron();
      }, 2000)
    }
    return orderBookData;
  }

  async getLimitOrderBookData(totalBidAmount = 5, totalAskSize = 150) {
    let orderBookData;
    try {
      orderBookData = Object.assign({}, await this.cacheManager.get("part1"));
      orderBookData.updatedAt = await this.cacheManager.get("part1UpdatedAt");
    } catch (e) {
      this.logger.debug("GET ORDER BOOK DATA from CACHE", e.messsage);
    }
    if(!orderBookData) {
      let self = this;
      setTimeout(() => {
        self.handleCron();
      }, 2000);
      return null;
    }
    let countBidAmount = 0;
    let countAskSize = 0;
    let updatedAt = orderBookData.updatedAt || "NONE";
    let bids = [];
    let asks = [];
    if(Array.isArray(orderBookData.bids)) {
      for(let i = 0; i < orderBookData.bids.length; i++) {
        let bid = orderBookData.bids[i];
        let amount = bid[0] * bid[1];
        if(countBidAmount + amount > totalBidAmount) break;
        countBidAmount += amount;
        bids.push(bid);
      }
    }
    if(Array.isArray(orderBookData.asks)) {
      for(let i = 0; i < orderBookData.asks.length; i++) {
        let ask = orderBookData.asks[i];
        let askSize = parseFloat(ask[1]);
        if(countAskSize + askSize > totalAskSize) break;
        countAskSize += askSize;
        asks.push(ask);
      }
    }
    let hasData = bids.length > 0;
    return {bids, asks, countBidAmount, countAskSize, updatedAt, hasData};
  }
}
