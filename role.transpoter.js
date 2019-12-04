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
    creep.memory.mining_timer = 0;
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
        const DEBUG_ON = creep.name === 'TU0';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        if (creep.spawning) return;

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

            creep.memory.mining_timer++;

            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep);
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

                var list = creep.room.lookForAt(LOOK_STRUCTURES, miner.pos);
                var container = list.filter((structure) => { return structure.structureType == STRUCTURE_CONTAINER });

                if (container.length == 1 && container[0].store[RESOURCE_ENERGY] > 0) {
                    debug('withdraw from container');
                    var c = container[0];
                    var draw_ok = creep.withdraw(c, RESOURCE_ENERGY);
                    //console.log(JSON.stringify(draw_ok));
                } else {
                    list = creep.room.lookForAt(LOOK_RESOURCES, miner.pos);
                    if (list.length == 0) {
                        //creep.say('wait drop');
                        return;
                    }
                    var drop = list[0];


                    debug('withdraw from ground');
                    let mine_ok = creep.pickup(drop);
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
                dd.move_to_destination(creep);
            } else {
                let store = dd.get_dest_obj(creep);
                let store_ok = creep.transfer(store, RESOURCE_ENERGY);
                if (store_ok == OK) {
                    tools.update_history_time_for_resource(creep, false);
                    dd.clear_destination(creep);// so that the creep can change to another store when it needs next time
                }
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    change_mode_taking(creep);
                } else {
                    change_mode_storing(creep);
                }
            }
        }
    }
};

module.exports = roleTranspoter;