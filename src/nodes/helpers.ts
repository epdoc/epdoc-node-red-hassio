import NodeRedContextService from './context-service';
import TypedInputService from './typed-input-service';
import { BaseNode } from './types';

// XXX delete if not used

/**
 * Create some of the dependencies needed for a BaseNode controller.
 * @param node The node to create the controller for.
 * @param homeAssistant The home assistant instance to use.
 * @returns The dependencies needed for a BaseNode controller.
 */
export function createControllerDependencies(node: BaseNode) {
  const nodeRedContextService = new NodeRedContextService(node);
  const typedInputService = new TypedInputService({
    nodeConfig: node.config,
    context: nodeRedContextService
  });

  return {
    nodeRedContextService,
    typedInputService
  };
}
