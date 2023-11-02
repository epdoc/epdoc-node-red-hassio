"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFan = void 0;
const epdoc_node_red_hautil_1 = require("epdoc-node-red-hautil");
const epdoc_util_1 = require("epdoc-util");
const REG = {
    onoff: new RegExp(/^(on|off)$/, 'i')
};
/**
 * Custom Node-RED function code for controlling a fan where (i) the fan on/off
 * is controlled by a switch (ii) the fan speed is controlled by a Bond Bridge
 * that sends out RF signals to the fan. Supports reading the state of an input
 * boolean that will keep the fan off. This can be used, for example, when there
 * is a lightning storm and you wish to keep the fan switched off at it's
 * switch.
 */
function setFan(params, fnSend, opts) {
    // const switch_id = "switch." + fan + "_fan_switch";
    const fan_id = 'fan.' + params.fan;
    const switch_id = fan_id;
    const DELAY = (0, epdoc_util_1.isNonEmptyArray)(params.delay) ? params.delay : [1000, 3000];
    const log = (msg) => {
        if ((0, epdoc_util_1.isFunction)(opts.node.warn)) {
            return opts.node.warn(msg);
        }
    };
    const ha = new epdoc_node_red_hautil_1.HA(opts);
    log(`setFan input params: ${JSON.stringify(params)}`);
    const bShutoff = (0, epdoc_util_1.isNonEmptyString)(params.shutOffEntityId)
        ? ha.entity(params.shutOffEntityId).isOn()
        : false;
    const swutch = ha.entity(switch_id);
    function fanState() {
        return ha.entity(switch_id).state();
    }
    let speed = 0;
    let service = '';
    let bOn = false;
    let bOff = false;
    if ((0, epdoc_node_red_hautil_1.isFanSpeed6Speed)(params.speed)) {
        speed = params.speed;
    }
    else if ((0, epdoc_util_1.isNumber)(params.percentage)) {
        speed = epdoc_node_red_hautil_1.FanSpeed6Service.percentageToSpeed(params.percentage);
    }
    if ((0, epdoc_util_1.isString)(params.service) && REG.onoff.test(params.service)) {
        service = params.service;
        bOn = service === 'on';
        bOff = service === 'off';
    }
    const timeout = parseInt(params.timeout, 10);
    log(`setFan bOn=${bOn} bOff=${bOff} speed=${speed} service=${service} timeout=${timeout}`);
    // const currentPct = ha.getEntitySpeed(fan_id);
    let bTurnedOn = false;
    return Promise.resolve()
        .then((resp) => {
        log(`${switch_id} is ${swutch.state()}`);
        log(`Shutoff (lightning) is ${bShutoff}`);
        if (swutch.isOn() && (bShutoff || bOff || (!bOn && speed === 0))) {
            log(`Turn off ${fan_id}`);
            let payload = (0, epdoc_node_red_hautil_1.newFanSpeed6Service)(params.fan, opts).off().payload();
            fnSend(payload);
        }
        else {
            log(`Fan ${fan_id} is ${swutch.state()}, no need to turn off`);
        }
        if (!swutch.isOn() && !bShutoff && (bOn || speed > 0)) {
            log(`Turn on ${switch_id} because fan was off`);
            let payload = (0, epdoc_node_red_hautil_1.newSwitchService)(switch_id, opts).on().payload();
            fnSend(payload);
            bTurnedOn = true;
        }
        else {
            log(`Fan ${fan_id} is already on`);
        }
        if (!bShutoff && speed > 0 && bTurnedOn) {
            log('1st delay of ' + DELAY[0] + ' for ' + switch_id);
            return (0, epdoc_util_1.delayPromise)(DELAY[0]);
        }
        else {
            return Promise.resolve();
        }
    })
        .then(function () {
        if (!bShutoff && speed > 0) {
            log('1st set fan speed to ' + speed + ' for ' + fan_id);
            let payload = (0, epdoc_node_red_hautil_1.newFanSpeed6Service)(params.fan, opts).speed(speed).payload();
            fnSend(payload);
            log('2nd delay of ' + DELAY[1] + ' for ' + switch_id);
            return (0, epdoc_util_1.delayPromise)(DELAY[1]);
        }
        else {
            log(`Skipping set speed step and first delay for ${fan_id}`);
            return Promise.resolve();
        }
    })
        .then(function () {
        if (!bShutoff && speed > 0) {
            log('2nd set fan speed to ' + speed + ' for ' + fan_id);
            let payload = (0, epdoc_node_red_hautil_1.newFanSpeed6Service)(params.fan, opts).speed(speed).payload();
            fnSend(payload);
        }
        return Promise.resolve();
    })
        .then(function () {
        if ((bOn || speed > 0) && timeout && !bShutoff) {
            log(`timeout ${timeout} for ${switch_id}`);
            return (0, epdoc_util_1.delayPromise)(timeout);
        }
        else {
            return Promise.resolve();
        }
    })
        .then(function () {
        if ((bOn || speed > 0) && timeout && !bShutoff) {
            log(`timeout turn off for ${switch_id}`);
            let payload = (0, epdoc_node_red_hautil_1.newSwitchService)(switch_id, opts).off().payload();
            fnSend(payload);
        }
        return Promise.resolve();
    });
}
exports.setFan = setFan;
//# sourceMappingURL=fan.js.map