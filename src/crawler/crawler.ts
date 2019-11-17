import WebSocket from 'ws';
import { Logger } from 'winston';
import { Msg } from '../pojo/msg';
import createLogger from '../util/logger';
import { ExchangeMetaInfo } from '../exchange/exchange_meta_info';
import CrawlType from './crawl_type';

export type ReceiveMessageCallback = (msg: Msg) => Promise<Boolean>;

async function defaultReceiveMessageCallback(msg: Msg): Promise<Boolean> {
  console.dir(msg); // eslint-disable-line no-console
  return true;
}

export default abstract class Crawler {
  protected exchangeMetaInfo: ExchangeMetaInfo;

  protected receiveMsgCallback: ReceiveMessageCallback;

  protected logger: Logger;

  protected crawlTypes: CrawlType[];

  protected pairs: string[];

  constructor(
    exchangeMetaInfo: ExchangeMetaInfo,
    crawlTypes: CrawlType[] = [CrawlType.ORDER_BOOK], // empty means all types
    pairs: string[] = [], // empty means all pairs
    receiveMsgCallback: ReceiveMessageCallback = defaultReceiveMessageCallback,
  ) {
    this.exchangeMetaInfo = exchangeMetaInfo;
    this.crawlTypes = crawlTypes;
    this.pairs = pairs;
    this.receiveMsgCallback = receiveMsgCallback;
    this.logger = createLogger(exchangeMetaInfo.name);
  }

  public async start() {
    if (this.pairs.length === 0) {
      const rawPairs = await this.exchangeMetaInfo.getRawPairs();
      rawPairs.forEach(rawPair => {
        this.pairs.push(this.exchangeMetaInfo.convertToStandardPair(rawPair));
      });
    }
    this.logger.info(JSON.stringify(this.pairs));

    await this.crawl();
  }

  protected abstract async crawl(): Promise<void>;

  protected static pairToDbName(pair: string): string {
    return pair;
  }

  protected getChannels(): string[] {
    const result: string[] = [];
    this.crawlTypes.forEach(crawlType => {
      this.pairs.forEach(pair => {
        const channel = this.exchangeMetaInfo.getChannel(crawlType, pair);
        result.push(channel);
      });
    });
    return result;
  }

  protected static listenWebSocket(
    websocket: WebSocket,
    handleData: (data: WebSocket.Data) => void,
    logger: Logger,
  ) {
    websocket.on('message', handleData);
    websocket.on('open', () => {
      logger.info(`${websocket.url} connected`);
    });
    websocket.on('error', error => {
      logger.error(JSON.stringify(error));
      process.exit(1); // fail fast, pm2 will restart it
    });
    websocket.on('close', () => {
      logger.info(`${websocket.url} disconnected`);
      process.exit(); // pm2 will restart it
    });
  }
}
