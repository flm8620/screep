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

function update_history_time_for_resource(creep, add_to) {
    if (creep.memory.resource_id) {
        if (!add_to)
            console.log(creep.memory.resource_id + ' resource timer average with ' + creep.memory.mining_timer)
        else
            console.log(creep.memory.resource_id + ' resource timer add by ' + (0.2 * creep.memory.mining_timer))
        if (!add_to)
            Memory.res[creep.memory.resource_id].history_time *= 0.8;
        Memory.res[creep.memory.resource_id].history_time += 0.2 * creep.memory.mining_timer;
    }
    creep.memory.resource_id = '';
    creep.memory.mining_timer = 0;
}

function update_harvester_contribution(creep, contrib) {
    if (!creep.memory.contrib) {
        creep.memory.contrib = 0;
    }
    creep.memory.contrib += contrib;
}

var roleHarvester = {
    run: function (creep) {
        if (creep.spawning) return;

        creep.memory.mining_timer++;

        if (!creep.memory.goto_store) {//mining
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                change_mode_storing(creep);
                return;
            }

            if (!dd.has_destination(creep)) {
                change_mode_mining(creep);
                return;
            }

            if (!dd.is_near_destination(creep)) {
                //var ran = _.random(0, 10);
                var ignoreCreeps = false;
                var color = '#ffffff';

                // if (ran == 0) {
                //     ignoreCreeps = true;
                //     color = '#ff0000';
                // }

                var move_ok = dd.move_to_destination(creep, { visualizePathStyle: { stroke: color }, ignoreCreeps });

                if (move_ok == ERR_NO_PATH || move_ok === -9999) {
                    creep.say('NO PATH ' + creep.memory.patience);
                    creep.memory.patience--;
                    creep.say(creep.memory.patience);
                }
                if (creep.memory.patience <= 0) {
                    update_history_time_for_resource(creep, true);
                    change_mode_mining(creep);
                }
            } else {
                let source = dd.get_dest_obj(creep);
                let mine_ok = creep.harvest(source);

                if (mine_ok == OK) {
                    var works = tools.count_move_parts(creep);
                } else if (mine_ok == ERR_NOT_ENOUGH_RESOURCES) {
                    change_mode_storing(creep);
                } else {//structure may be removed
                    change_mode_storing(creep);
                }
            }
        } else {//storing
            let current_carry = creep.store.getUsedCapacity(RESOURCE_ENERGY);
            if (current_carry == 0) {
                change_mode_mining(creep);
                return;
            }

            if (!dd.has_destination(creep)) {
                change_mode_storing(creep);
                return;
            }

            if (!dd.is_near_destination(creep)) {
                dd.move_to_destination(creep, { visualizePathStyle: { stroke: '#ffffff' }, ignoreCreeps: false });
            } else {
                let store = dd.get_dest_obj(creep);
                let store_ok = creep.transfer(store, RESOURCE_ENERGY);
                if (store_ok == OK) {
                    update_history_time_for_resource(creep, false);
                    update_harvester_contribution(creep, current_carry);
                } else {
                    change_mode_storing(creep);
                }
            }
        }
    }
};

module.exports = roleHarvester;