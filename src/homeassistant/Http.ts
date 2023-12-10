import axios, { AxiosInstance, AxiosRequestConfig, ResponseType } from 'axios';
import https from 'https';
import Debug from 'debug';
const debug = Debug('home-assistant:http');

import { Credentials } from './';

export type HttpConfig = Credentials & {
  rejectUnauthorizedCerts: boolean;
};

export default class Http {
  #client: AxiosInstance;

  constructor(config: HttpConfig) {
    const apiOpts: AxiosRequestConfig = {
      baseURL: `${config.host}/api`,
      headers: { Authorization: `Bearer ${config.access_token}` }
    };

    if (!config.rejectUnauthorizedCerts) {
      apiOpts.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    this.#client = axios.create(apiOpts);
  }

  fireEvent(event: string, data: { [key: string]: any }): Promise<unknown> {
    return this.post(`events/${event}`, data);
  }

  renderTemplate(templateString: string): Promise<string> {
    return this.post<string>('template', { template: templateString }, 'text');
  }

  async post<T>(path: string, data: any = {}, responseType: ResponseType = 'json'): Promise<T> {
    debug(`HTTP POST: ${this.#client.defaults.baseURL}/${path}`);

    this.#client.defaults.responseType = responseType;

    const response = await this.#client.post(path, data).catch((err) => {
      debug(`POST: request error: ${err.toString()}`);
      throw err;
    });

    return responseType === 'json' ? response.data ?? '' : (response.data as any);
  }

  async get<T>(path: string, params: any = {}, responseType: ResponseType = 'json'): Promise<T> {
    debug(`HTTP GET: ${this.#client.defaults.baseURL}/${path}`);

    this.#client.defaults.responseType = responseType;

    const response = await this.#client.request({ url: path, params }).catch((err) => {
      debug(`GET: request error: ${err.toString()}`);
      throw err;
    });

    return responseType === 'json' ? response.data ?? '' : (response.data as any);
  }
}
