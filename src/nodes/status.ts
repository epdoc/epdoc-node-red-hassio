import { isError } from 'epdoc-util';
import { NodeStatusFill, NodeStatusShape } from 'node-red';
import { formatDate } from './datetime-format';
import { BaseNode } from './types';

export class Status {
  protected _node: BaseNode;
  protected _fill: NodeStatusFill;
  protected _shape: NodeStatusShape = 'dot';
  protected _text: string;

  constructor(node: BaseNode) {
    this._node = node;
  }

  red(): this {
    this._fill = 'red';
    return this;
  }

  green(): this {
    this._fill = 'green';
    return this;
  }

  yellow(): this {
    this._fill = 'yellow';
    return this;
  }

  blue(): this {
    this._fill = 'blue';
    return this;
  }

  grey(): this {
    this._fill = 'grey';
    return this;
  }

  dot(): this {
    this._shape = 'dot';
    return this;
  }

  ring(): this {
    this._shape = 'ring';
    return this;
  }

  text(text: string = ''): this {
    this._text = text;
    return this;
  }

  error(err: Error | string) {
    if (isError(err)) {
      return this.text(err.message).red().ring().update();
    }
    return this.text(err).red().ring().update();
  }

  success(text: string = 'success') {
    return this.text(text).green().dot().update();
  }

  update(): this {
    this._node.status({ fill: this._fill, shape: this._shape, text: `${this._text} : ${this.dateString()}` });
    return this;
  }

  protected dateString(): string {
    // const separator = this.config?.statusSeparator ?? '';
    return formatDate({});
  }
}
