import { NodeStatus } from 'node-red';

import { RED } from '../../globals';
import { isTranslationKey } from './BaseError';
import { formatDate } from './datetime-format';
import { i18nKeyandParams } from './i18n';
import { BaseNode } from './types';

export enum StatusColor {
  Blue = 'blue',
  Green = 'green',
  Grey = 'grey',
  Red = 'red',
  Yellow = 'yellow'
}

export enum StatusShape {
  Dot = 'dot',
  Ring = 'ring'
}

export interface StatusConstructor<T extends BaseNode = BaseNode> {
  node: T;
}

export default class Status<T extends BaseNode = BaseNode> {
  // protected readonly config: ServerNodeConfig;
  protected lastStatus: NodeStatus = {};
  protected readonly node: T;

  constructor(props: StatusConstructor<T>) {
    this.node = props.node;
  }

  protected onStateChange() {
    this.updateStatus(this.lastStatus);
  }

  protected get isExposeAsEnabled(): boolean {
    return false;
  }

  protected get dateString(): string {
    const separator = '';
    const date = formatDate({});

    return `${separator}${date}`;
  }

  protected updateStatus(status: NodeStatus): void {
    if (this.isExposeAsEnabled === false) {
      status = {
        fill: StatusColor.Grey,
        shape: StatusShape.Dot,
        text: 'home-assistant.status.disabled'
      };
    }

    this.node.status(status);
  }

  public set(status: NodeStatus = {}): void {
    if (this.isExposeAsEnabled) {
      this.lastStatus = status;
    }

    this.updateStatus(status);
  }

  public setText(text = ''): void {
    this.set({ text });
  }

  public setError(text: i18nKeyandParams = 'home-assistant.status.error'): void {
    this.set({
      fill: StatusColor.Red,
      shape: StatusShape.Ring,
      text: this.translateText(text)
    });
  }

  public setFailed(text: i18nKeyandParams = 'home-assistant.status.failed'): void {
    this.set({
      fill: StatusColor.Red,
      shape: StatusShape.Ring,
      text: this.translateText(text)
    });
  }

  public setSending(text: i18nKeyandParams = 'home-assistant.status.sending'): void {
    this.set({
      fill: StatusColor.Yellow,
      shape: StatusShape.Dot,
      text: this.translateText(text)
    });
  }

  public setSuccess(text: i18nKeyandParams = 'home-assistant.status.success'): void {
    this.set({
      fill: StatusColor.Green,
      shape: StatusShape.Dot,
      text: this.translateText(text)
    });
  }

  protected translateText(data: i18nKeyandParams): string {
    const [key, params] = Array.isArray(data) ? data : [data, undefined];
    const message = isTranslationKey(key) ? RED._(key, params) : key;

    return `${message} ${this.dateString}`;
  }
}
