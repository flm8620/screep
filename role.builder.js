var tools = require('tools');
var dd = require('destinations');
const PATIENCE_MAX = 5;

function change_mode_building(creep) {
    dd.clear_destination(creep);
    creep.say('build');
    creep.memory.building = true;
    var ok = dd.set_id_as_destination(creep, dd.pick_nearest_site_id(creep));
}
function change_mode_recharging_or_become_harvester(creep) {
    //console.log(JSON.stringify(creep));
    creep.say('reload');
    creep.memory.building = false;
    tools.get_energy_or_become_harvester(creep);
}
function count_down(creep) {
    if (!('patience' in creep.memory)) {
        creep.memory.patience = PATIENCE_MAX;
    } else {
        creep.memory.patience--;
    }
    return creep.memory.patience <= 0;
}

var roleBuilder = {

    run: function (creep) {
        if (creep.spawning) return;
        if (creep.memory.building) {

            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                change_mode_recharging_or_become_harvester(creep);

            } else {

                if (!dd.has_destination(creep)) {
                    change_mode_building(creep);
                    return;
                }

                if (!dd.in_range_destination(creep, 3)) {
                    var move_ok = dd.move_to_destination(creep, { visualizePathStyle: { stroke: '#ffffff' }, ignoreCreeps: false });

                } else {
                    let struct = dd.get_dest_obj(creep);
                    let build_ok = 9999;
                    if (struct) {
                        if (struct.hits > 0) {
                            if (struct.hits == struct.hitsMax) {
                                change_mode_building(creep);
                            } else {
                                build_ok = creep.repair(struct);
                            }
                        } else {
                            build_ok = creep.build(struct);
                        }
                    }
                    if (build_ok == OK) {

                    } else if (build_ok == ERR_NOT_ENOUGH_RESOURCES) {
                        change_mode_recharging_or_become_harvester(creep);
                    } else {//structure may be removed
                        change_mode_building(creep);
                    }
                }
            }
        }
        else {//recharging
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                change_mode_building(creep);
            } else {
                let ok = tools.goto_and_get_energy(creep);
                if (!ok) change_mode_recharging_or_become_harvester(creep);
                // else {
                //     if (count_down(creep)) {
                //         change_mode_building(creep);
                //     }
                // }
            }
        }
    }
};

module.exports = roleBuilder;