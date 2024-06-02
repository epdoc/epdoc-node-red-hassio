import { TypedInputTypes } from './const';
import NodeRedContext from './context-service';

export default class TypedInputService {
  readonly #nodeConfig: Record<string, any>;
  readonly #context: NodeRedContext;

  constructor({ nodeConfig, context }: { nodeConfig: Record<string, any>; context: NodeRedContext }) {
    this.#nodeConfig = nodeConfig;
    this.#context = context;
  }

  async getValue(value: string, valueType: TypedInputTypes, props: Record<string, any> = {}) {
    let val;
    switch (valueType) {
      case TypedInputTypes.Message:
      case TypedInputTypes.Flow:
      case TypedInputTypes.Global:
        val = this.#context.get(valueType, value, props.message);
        break;
      case TypedInputTypes.Boolean:
        val = value === 'true';
        break;
      case TypedInputTypes.JSON:
        try {
          val = JSON.parse(value);
        } catch (e) {
          // error parsing
        }
        break;
      case TypedInputTypes.Date:
        val = Date.now();
        break;
      case TypedInputTypes.Number:
        val = Number(value);
        break;
      case TypedInputTypes.None:
        val = undefined;
        break;
      //   case TypedInputTypes.Config: {
      //     val = cloneDeep(value.length ? selectn(value, this.#nodeConfig) : this.#nodeConfig);
      //     break;
      //   }
      case TypedInputTypes.Data:
      case TypedInputTypes.Entity:
      case TypedInputTypes.EntityState:
      case TypedInputTypes.EventData:
      case TypedInputTypes.Headers:
      case TypedInputTypes.Params:
      case TypedInputTypes.PrevEntity:
      case TypedInputTypes.PreviousValue:
      case TypedInputTypes.Results:
      case TypedInputTypes.TriggerId:
      case TypedInputTypes.Value:
        val = props[valueType];
        break;
      default:
        val = value;
    }
    return val;
  }
}
