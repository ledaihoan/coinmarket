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
}
