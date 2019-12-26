var tools = require('tools');
var dd = require('destinations');


function change_mode_taking(creep, debug) {
    dd.clear_destination(creep);
    creep.say('take');
    creep.memory.goto_store = false;
    creep.memory.patience = PATIENCE_MAX;
    let dropped_id = dd.pick_droped_stuff(creep, debug);
    return dd.set_id_as_destination(creep, dropped_id);
}

function change_mode_storing(creep) {
    //console.log(JSON.stringify(creep));
    creep.memory.goto_store = true;
    let id = null;
    if (creep.store.getUsedCapacity() != creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
        // there are non-energy stuff
        creep.say('store o');
        id = dd.pick_non_full_store_id(creep, false);
    } else {
        creep.say('store e');
        id = dd.pick_non_full_store_id(creep);
    }
    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, id);
}

const PATIENCE_MAX = 20;
var roleTranspoter = {
    run: function (creep) {
        if (creep.spawning) return;
        const DEBUG_ON = creep.name === 'T6D';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        creep.memory.mining_timer++;

        if (!creep.memory.goto_store) {// taking
            debug('try taking');
            if (creep.store.getFreeCapacity() == 0) {
                debug('change_mode_storing');
                change_mode_storing(creep);
            }
            if (!dd.has_destination(creep)) {
                debug('!has_destination, change_mode_taking');
                change_mode_taking(creep, DEBUG_ON);
            }
        } else {// storing
            debug('try storing');
            if (creep.store.getUsedCapacity() == 0) {
                debug('empty already');
                change_mode_taking(creep, DEBUG_ON);
            }
            if (!dd.has_destination(creep)) {
                debug('no destination');
                change_mode_storing(creep);
            }
        }

        if (!creep.memory.goto_store) {//taking
            debug('really taking');

            if (!dd.has_destination(creep)) {
                debug('!has_destination');
                tools.random_move(creep);
                return;
            }

            if (creep.memory.patience <= 0) {
                debug('no patience');
                tools.random_move(creep);
                if (creep.store.getUsedCapacity() < 0.5 * creep.store.getCapacity()) {
                    debug('change_mode_taking');
                    change_mode_taking(creep, DEBUG_ON);
                } else {
                    debug('change_mode_storing');
                    change_mode_storing(creep);
                }
                return;
            }
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep, DEBUG_ON);
                if (move_ok == ERR_NO_PATH) {
                    creep.memory.patience--;
                    if (creep.memory.patience < PATIENCE_MAX)
                        creep.say(creep.memory.patience);
                }

            } else {
                debug('try pickup');
                const stuff = dd.get_dest_obj(creep);
                if (stuff) {
                    let pick_ok = creep.pickup(stuff);
                    if (pick_ok == OK) {
                        debug('pickup OK');
                    } else if (pick_ok == ERR_INVALID_TARGET) {
                        debug('try withdraw');
                        let withdraw_ok = -1;
                        for (let name in stuff.store) {
                            withdraw_ok = creep.withdraw(stuff, name);
                            break;
                        }
                        if (withdraw_ok == OK) {
                            debug('withdraw OK');
                        } else {
                            debug('withdraw failed');
                        }
                    } else {
                        debug(`pickup not OK: ${pick_ok}`);
                    }
                }
                dd.clear_destination(creep);
            }
        }

        if (creep.memory.goto_store) {//storing
            debug('really storing');

            if (!dd.has_destination(creep)) {
                debug('!has_destination');
                return;
            }

            if (!dd.is_near_destination(creep)) {
                dd.move_to_destination(creep, DEBUG_ON);
            } else {
                const store = dd.get_dest_obj(creep);
                if (store) {
                    for (let name in creep.store) {
                        let store_ok = creep.transfer(store, name);
                        if (store_ok == OK) {
                            debug('store OK');
                        } else {
                            debug(`store not OK: ${store_ok}`);
                        }
                    }
                }
                dd.clear_destination(creep);
            }
        }
    }
};

module.exports = roleTranspoter;