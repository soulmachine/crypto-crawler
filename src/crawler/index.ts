import { Msg } from '../pojo/msg';

export const CHANNEL_TYPES = [
  'BBO',
  'FullOrderBook',
  'KLine',
  'OrderBook', // first is full, followed by updates
  'OrderBookUpdate',
  'Ticker',
  'Trade',
] as const;
export type ChannelType = typeof CHANNEL_TYPES[number];

export const EXCHANGES = [
  'Binance',
  'Coinbase',
  'Huobi',
  'Kraken',
  'Newdex',
  'OKEx_Spot',
  'WhaleEx',
] as const;
export type SupportedExchange = typeof EXCHANGES[number];

export type MsgCallback = (msg: Msg) => Promise<Boolean>;
export async function defaultMsgCallback(msg: Msg): Promise<Boolean> {
  console.dir(msg); // eslint-disable-line no-console
  return true;
}
