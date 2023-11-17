import { FanControlNode } from '.';
import Status from '../common/Status';
import NodeRedContextService from '../common/context-service';

export class FanControlController {
  node: FanControlNode;
  status: Status;
  ctxService: NodeRedContextService;

  constructor(node: FanControlNode, status: Status, ctxService: NodeRedContextService) {
    this.node = node;
    this.status = status;
    this.ctxService = ctxService;
  }
}
