import { EntityId } from 'epdoc-node-red-hautil';
import { Dict } from 'epdoc-util';

export default class EntitySelector {
  constructor(arg: Dict) {}
  get entityId(): EntityId {
    return '';
  }

  destroy() {}
}
