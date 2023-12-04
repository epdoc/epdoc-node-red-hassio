import { NodeStatus } from 'node-red';

import { formatDate } from './datetime-format';
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
        text: 'DISABLED'
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

  public setError(text: string = 'error'): void {
    this.set({
      fill: StatusColor.Red,
      shape: StatusShape.Ring,
      text: text
    });
  }

  public setFailed(text: string = 'failed'): void {
    this.set({
      fill: StatusColor.Red,
      shape: StatusShape.Ring,
      text: text
    });
  }

  public setSending(text: string = 'sending'): void {
    this.set({
      fill: StatusColor.Yellow,
      shape: StatusShape.Dot,
      text: text
    });
  }

  public setSuccess(text: string = 'success'): void {
    this.set({
      fill: StatusColor.Green,
      shape: StatusShape.Dot,
      text: text
    });
  }
}
