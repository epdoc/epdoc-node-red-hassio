import { EntityId, EntityService, EntityShortId, EntityShortService, FanSpeed6Speed, NodeRedOpts, ServicePayload } from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
export type PayloadSendFunction = (payload: ServicePayload) => void | Promise<void>;
export type SetFanParams = {
    fan: EntityShortId;
    speed?: FanSpeed6Speed;
    percentage?: number;
    service: EntityService | EntityShortService;
    timeout?: Milliseconds;
    shutOffEntityId?: EntityId;
    delay?: Milliseconds[];
};
/**
 * Custom Node-RED function code for controlling a fan where (i) the fan on/off
 * is controlled by a switch (ii) the fan speed is controlled by a Bond Bridge
 * that sends out RF signals to the fan. Supports reading the state of an input
 * boolean that will keep the fan off. This can be used, for example, when there
 * is a lightning storm and you wish to keep the fan switched off at it's
 * switch.
 */
export declare function setFan(params: SetFanParams, fnSend: PayloadSendFunction, opts: NodeRedOpts): Promise<void>;
