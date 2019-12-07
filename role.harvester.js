var tools = require('tools');
var dd = require('destinations');

const PATIENCE_MAX = 40;

function change_mode_mining(creep) {
    dd.clear_destination(creep);
    creep.say('mining');
    creep.memory.goto_store = false;
    creep.memory.patience = PATIENCE_MAX;
    var r_id = dd.pick_resource_id_harvester(creep);
    if (!r_id) return null;
    creep.memory.resource_id = r_id;
    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, r_id);
}

function change_mode_storing(creep) {
    creep.say('storing');
    creep.memory.goto_store = true;
    var id = dd.pick_non_full_store_id(creep);
    if (!id) {
        id = dd.pick_tower_id(creep);
    }
    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, id);
}

function update_harvester_contribution(creep) {
    let last_used_capacity = creep.memory.last_used_capacity;
    if (last_used_capacity) {
        let current_carry = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        if (!creep.memory.contrib) {
            creep.memory.contrib = 0;
        }
        creep.memory.contrib += last_used_capacity - current_carry;
        delete creep.memory.last_used_capacity;
    }
}

var roleHarvester = {
    run: function (creep) {
        const DEBUG_ON = creep.name === '';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        if (creep.spawning) return;
        debug('====== round begin ======');
        creep.memory.mining_timer++;
        let current_carry = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        update_harvester_contribution(creep);
        if (creep.memory.goto_store) {
            debug('try goto_store');
            if (current_carry == 0) {
                debug('carry empty');
                change_mode_mining(creep);
            } else if (!dd.has_destination(creep)) {
                debug('no dest');
                change_mode_storing(creep);
            }
        } else {//mining
            debug('try mining');
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                debug('full');
                change_mode_storing(creep);
            }
            else if (!dd.has_destination(creep)) {
                debug('no dest');
                change_mode_mining(creep);
            }
        }

        if (!creep.memory.goto_store) {//mining
            debug('mining');
            if (!dd.is_near_destination(creep)) {
                debug('move_to_destination');
                var move_ok = dd.move_to_destination(creep, DEBUG_ON);
                if (move_ok == ERR_NO_PATH) {
                    creep.say('NO PATH ' + creep.memory.patience);
                    creep.memory.patience--;
                    creep.say(creep.memory.patience);
                }
                if (creep.memory.patience <= 0) {
                    debug('no patience, change mining');
                    update_history_time_for_resource(creep, true);
                    change_mode_mining(creep);
                }
            } else {
                debug('harvest');
                let source = dd.get_dest_obj(creep);
                let mine_ok = creep.harvest(source);

                if (mine_ok == OK) {
                    debug('harvest OK');
                    //var works = tools.count_move_parts(creep);
                } else if (mine_ok == ERR_NOT_ENOUGH_RESOURCES) {
                    debug('harvest ERR_NOT_ENOUGH_RESOURCES');
                    if(creep.store.getUsedCapacity(RESOURCE_ENERGY) < 0.5 * creep.store.getCapacity(RESOURCE_ENERGY))
                        change_mode_mining(creep);
                    else
                        change_mode_storing(creep);
                } else {//structure may be removed
                    debug('harvest other error');
                    change_mode_storing(creep);
                }
            }
        } else {//storing
            debug('storing');
            if (!dd.is_near_destination(creep)) {
                debug('move_to_destination');
                dd.move_to_destination(creep, DEBUG_ON);
            } else {
                debug('store');
                let store = dd.get_dest_obj(creep);
                let store_ok = creep.transfer(store, RESOURCE_ENERGY);
                creep.memory.last_used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

                if (store_ok == OK) {
                    debug('store OK');
                    tools.update_history_time_for_resource(creep, false);
                    dd.clear_destination(creep);// so that the creep can change to another store when it needs next time
                }
                else {
                    debug('store not OK');
                    change_mode_storing(creep);
                }
            }
        }
    }
};

module.exports = roleHarvester;