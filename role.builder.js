var tools = require('tools');
var dd = require('destinations');
const PATIENCE_MAX = 5;

function change_mode_building(creep) {
    dd.clear_destination(creep);
    creep.memory.building = true;
    let site = dd.pick_nearest_site_id(creep) || dd.pick_controller_id(creep);
    if (!site) {
        creep.say('no build');
        tools.random_move(creep);
    } else {
        creep.say('build');
    }
    var ok = dd.set_id_as_destination(creep, site);
}
function change_mode_recharging_or_become_transpoter(creep) {
    //console.log(JSON.stringify(creep));
    creep.say('reload');
    creep.memory.building = false;
    tools.get_energy_or_become_transpoter(creep);
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
        const DEBUG_ON = creep.name === '';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        if (creep.spawning) return;
        if (creep.memory.building) {
            debug('try building');
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                debug('no energy');
                change_mode_recharging_or_become_transpoter(creep);
            } else if (!dd.has_destination(creep)) {
                debug('no destination');
                change_mode_building(creep);
            }
        } else {
            debug('try charging');
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                debug('full');
                change_mode_building(creep);
            }
        }
        if (creep.memory.role !== 'builder') return;


        if (creep.memory.building) {
            debug('really building');
            if (!dd.in_range_destination(creep, 3)) {
                debug('moving');
                let move_ok = dd.move_to_destination(creep, DEBUG_ON, { range: 3 });
            } else {
                debug('get struct');
                let struct = dd.get_dest_obj(creep);
                let build_ok = 9999;
                if (struct) {
                    if (struct.structureType === STRUCTURE_CONTROLLER) {
                        build_ok= creep.upgradeController(dd.get_dest_obj(creep));
                    } else if (struct.hits > 0) {
                        if (struct.hits == struct.hitsMax) {
                            debug('struct repaired');
                            change_mode_building(creep);
                        } else {
                            debug('repair struct');
                            build_ok = creep.repair(struct);
                        }
                    } else {
                        debug('build struct');
                        build_ok = creep.build(struct);
                    }
                } else {
                    debug('no struct');
                }
                if (build_ok == OK) {
                    debug('build OK');
                } else if (build_ok == ERR_NOT_ENOUGH_RESOURCES) {
                    debug('build ERR_NOT_ENOUGH_RESOURCES');
                    change_mode_recharging_or_become_transpoter(creep);
                } else {//structure may be removed
                    debug('build other error');
                    change_mode_building(creep);
                }
            }

        }
        else {//recharging
            debug('really charging');
            let ok = tools.goto_and_get_energy(creep);
            if (!ok) {
                debug('change_mode_recharging_or_become_harvester');
                change_mode_recharging_or_become_transpoter(creep);
            }
            // else {
            //     if (count_down(creep)) {
            //         change_mode_building(creep);
            //     }
            // }
        }
    }
};

module.exports = roleBuilder;