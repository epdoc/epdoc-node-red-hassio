import { NodeDone } from 'epdoc-node-red-hautil';
import { NodeMessage } from 'node-red';
import NodeRedContextService from './context-service';
import { NodeEvent } from './events';
import { OutputProperty } from './nodes';
import TypedInputService from './typed-input-service';
import { BaseNode } from './types';

export interface OutputControllerConstructor<T extends BaseNode> {
  contextService: NodeRedContextService;
  node: T;
  typedInputService: TypedInputService;
}

export default class OutputController<T extends BaseNode = BaseNode> {
  protected readonly contextService: NodeRedContextService;
  protected readonly node: T;
  protected readonly typedInputService: TypedInputService;

  constructor({ contextService: contextService, node, typedInputService }: OutputControllerConstructor<T>) {
    this.contextService = contextService;
    this.node = node;
    this.typedInputService = typedInputService;

    node.on(NodeEvent.Close, this.#preOnClose.bind(this));

    const name = this.node?.config?.name ?? 'undefined';
    node.debug(`instantiated node, name: ${name}`);
  }

  protected onClose?(removed: boolean): void;

  protected debugToClient(message: any | any[]) {
    // @ts-ignore
    this.debugToClient(this.node, message);
  }

  protected async setCustomOutputs(
    properties: OutputProperty[] = [],
    message: NodeMessage,
    extras: Record<string, any>
  ) {
    for (const item of properties) {
      const value = await this.typedInputService.getValue(item.value, item.valueType, {
        message,
        ...extras
      });

      try {
        this.contextService.set(value, item.propertyType, item.property, message);
      } catch (e) {
        this.node.warn(`Custom Ouput Error (${item.propertyType}:${item.property}): ${e}`);
      }
    }
  }

  #preOnClose(removed: boolean, done: NodeDone) {
    this.node.debug(`closing node. Reason: ${removed ? 'node deleted' : 'node re-deployed'}`);
    try {
      this.onClose?.(removed);
      done();
    } catch (e) {
      if (e instanceof Error) {
        done(e);
      } else {
        done(new Error(e as string));
      }
    }
  }
}
