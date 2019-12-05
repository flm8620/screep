var tools = require('tools');
var dd = require('destinations');


function change_mode_taking(creep) {
    dd.clear_destination(creep);
    creep.say('take');
    creep.memory.goto_store = false;
    var r_id = dd.pick_resource_id(creep);
    console.log(`transpoter take ${r_id}`)

    if (!r_id) return null;
    creep.memory.resource_id = r_id;
    creep.memory.patience = PATIENCE_MAX;
    var miner_id = Memory.res[r_id].miner_id;
    if (!Game.getObjectById(miner_id)) {
        creep.memory.miner_id = null;
        creep.say('no miner');
        return false;
    }
    creep.memory.miner_id = miner_id;
    return dd.set_id_as_destination(creep, miner_id);
}

function change_mode_storing(creep) {
    //console.log(JSON.stringify(creep));
    creep.say('storing');
    creep.memory.goto_store = true;
    var id = dd.pick_non_full_store_id(creep);
    if (!id) {
        id = dd.pick_tower_id(creep);
    }

    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, id);
}

const PATIENCE_MAX = 20;
var roleTranspoter = {
    run: function (creep) {
        if (creep.spawning) return;
        const DEBUG_ON = creep.name === 'TYO';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        creep.memory.mining_timer++;

        if (!creep.memory.goto_store) {// taking
            debug('try taking');
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                debug('change_mode_storing');
                change_mode_storing(creep);
            }
            if (!creep.memory.miner_id) {
                debug('no miner id, change_mode_taking');
                change_mode_taking(creep);
            }
            if (!dd.has_destination(creep)) {
                debug('!has_destination, change_mode_taking');
                change_mode_taking(creep);
            }
        } else {// storing
            debug('try storing');
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                debug('empty already');
                change_mode_taking(creep);
            }
            if (!dd.has_destination(creep)) {
                debug('no destination');
                change_mode_storing(creep);
            }
        }

        if (!creep.memory.goto_store) {//taking
            debug('really taking');

            if (!creep.memory.miner_id) {
                debug('no miner id!');
                return;
            }
            if (!dd.has_destination(creep)) {
                debug('!has_destination');
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
                if (creep.memory.patience <= 0) change_mode_taking(creep);
            } else {
                debug('is_near_destination');
                var miner = Game.getObjectById(creep.memory.miner_id);
                if (!creep.pos.isNearTo(miner)) {
                    debug('retrace miner');
                    change_mode_taking(creep);
                    return;
                }
                let already_taken_some = creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
                let list = creep.room.lookForAt(LOOK_RESOURCES, miner.pos);
                if (list.length > 0) {
                    var drop = list[0];
                    if (drop.amount > 100 || already_taken_some) {
                        debug('withdraw from ground');
                        let mine_ok = creep.pickup(drop);
                    } else {
                        debug('wait others to take');
                    }
                } else {
                    list = creep.room.lookForAt(LOOK_STRUCTURES, miner.pos);
                    let container = list.filter((structure) => { return structure.structureType == STRUCTURE_CONTAINER });

                    if (container.length == 1 && container[0].store[RESOURCE_ENERGY] > 0) {

                        let c = container[0];
                        if (c.store[RESOURCE_ENERGY] > 100 || already_taken_some) {
                            debug('withdraw from container');
                            let draw_ok = creep.withdraw(c, RESOURCE_ENERGY);
                        } else {
                            debug('wait others to take');
                        }
                        //console.log(JSON.stringify(draw_ok));
                    } else {
                        debug('wait drop');
                    }
                }
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
                let store = dd.get_dest_obj(creep);
                let store_ok = creep.transfer(store, RESOURCE_ENERGY);
                if (store_ok == OK) {
                    debug('store OK');
                    tools.update_history_time_for_resource(creep, false);
                    dd.clear_destination(creep);// so that the creep can change to another store when it needs next time
                } else {
                    debug('store not OK');
                    change_mode_storing(creep);
                }
            }
        }
    }
};

module.exports = roleTranspoter;