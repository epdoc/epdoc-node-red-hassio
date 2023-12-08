import OutputController, { OutputControllerConstructor } from '../output-controller';
import { FanControlNode } from './fan-control-node';

export interface FanControllerConstructor extends OutputControllerConstructor<FanControlNode> {}

export class FanController extends OutputController {
  constructor(params: FanControllerConstructor) {
    super(params);
  }
}
