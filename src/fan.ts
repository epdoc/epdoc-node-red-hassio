import {
  Entity,
  EntityId,
  EntityService,
  EntityShortId,
  EntityShortService,
  FanSpeed6Service,
  FanSpeed6Speed,
  HA,
  NodeRedOpts,
  ServicePayload,
  isFanSpeed6Speed,
  newFanSpeed6Service,
  newSwitchService
} from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import {
  delayPromise,
  isFunction,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isString
} from 'epdoc-util';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i')
};

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
export function setFan(params: SetFanParams, fnSend: PayloadSendFunction, opts: NodeRedOpts) {
  // const switch_id = "switch." + fan + "_fan_switch";
  const fan_id: EntityId = 'fan.' + params.fan;
  const switch_id: EntityId = fan_id;

  const DELAY = isNonEmptyArray(params.delay) ? params.delay : [1000, 3000];

  const log = (msg) => {
    if (isFunction(opts.node.warn)) {
      return opts.node.warn(msg);
    }
  };

  const ha: HA = new HA(opts);
  log(`setFan input params: ${JSON.stringify(params)}`);
  const bShutoff = isNonEmptyString(params.shutOffEntityId)
    ? ha.entity(params.shutOffEntityId).isOn()
    : false;

  const swutch: Entity = ha.entity(switch_id);

  function fanState() {
    return ha.entity(switch_id).state();
  }

  let speed: FanSpeed6Speed = 0;
  let service: EntityService = '';
  let bOn = false;
  let bOff = false;
  if (isFanSpeed6Speed(params.speed)) {
    speed = params.speed;
  } else if (isNumber(params.percentage)) {
    speed = FanSpeed6Service.percentageToSpeed(params.percentage);
  }
  if (isString(params.service) && REG.onoff.test(params.service)) {
    service = params.service;
    bOn = service === 'on';
    bOff = service === 'off';
  }
  const timeout = parseInt(params.timeout as unknown as string, 10);

  log(`setFan bOn=${bOn} bOff=${bOff} speed=${speed} service=${service} timeout=${timeout}`);

  // const currentPct = ha.getEntitySpeed(fan_id);

  let bTurnedOn = false;

  return Promise.resolve()
    .then((resp) => {
      log(`${switch_id} is ${swutch.state()}`);
      log(`Shutoff (lightning) is ${bShutoff}`);
      if (swutch.isOn() && (bShutoff || bOff || (!bOn && speed === 0))) {
        log(`Turn off ${fan_id}`);
        let payload: ServicePayload = newFanSpeed6Service(params.fan, opts).off().payload();
        fnSend(payload);
      } else {
        log(`Fan ${fan_id} is ${swutch.state()}, no need to turn off`);
      }
      if (!swutch.isOn() && !bShutoff && (bOn || speed > 0)) {
        log(`Turn on ${switch_id} because fan was off`);
        let payload = newSwitchService(switch_id, opts).on().payload();
        fnSend(payload);
        bTurnedOn = true;
      } else {
        log(`Fan ${fan_id} is already on`);
      }
      if (!bShutoff && speed > 0 && bTurnedOn) {
        log('1st delay of ' + DELAY[0] + ' for ' + switch_id);
        return delayPromise(DELAY[0]);
      } else {
        return Promise.resolve();
      }
    })
    .then(function () {
      if (!bShutoff && speed > 0) {
        log('1st set fan speed to ' + speed + ' for ' + fan_id);
        let payload = newFanSpeed6Service(params.fan, opts).speed(speed).payload();
        fnSend(payload);
        log('2nd delay of ' + DELAY[1] + ' for ' + switch_id);
        return delayPromise(DELAY[1]);
      } else {
        log(`Skipping set speed step and first delay for ${fan_id}`);
        return Promise.resolve();
      }
    })
    .then(function () {
      if (!bShutoff && speed > 0) {
        log('2nd set fan speed to ' + speed + ' for ' + fan_id);
        let payload = newFanSpeed6Service(params.fan, opts).speed(speed).payload();
        fnSend(payload);
      }
      return Promise.resolve();
    })
    .then(function () {
      if ((bOn || speed > 0) && timeout && !bShutoff) {
        log(`timeout ${timeout} for ${switch_id}`);
        return delayPromise(timeout);
      } else {
        return Promise.resolve();
      }
    })
    .then(function () {
      if ((bOn || speed > 0) && timeout && !bShutoff) {
        log(`timeout turn off for ${switch_id}`);
        let payload = newSwitchService(switch_id, opts).off().payload();
        fnSend(payload);
      }
      return Promise.resolve();
    });
}
