var tools = require('tools');
var dd = require('destinations');

function change_mode_upgrading(creep) {
    creep.say('upgrade');
    creep.memory.upgrading = true;
    dd.clear_destination(creep);
    return dd.set_id_as_destination(creep, dd.pick_controller_id(creep));
}
function change_mode_recharging_or_become_transpoter(creep) {
    creep.say('reload');
    creep.memory.upgrading = false;
    dd.clear_destination(creep);
    tools.get_energy_or_become_transpoter(creep);
}

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function (creep) {
        const DEBUG_ON = creep.name === 'UZV';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        if (creep.spawning) return;
        if (creep.memory.upgrading) {
            debug(`upgrading`);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                debug(`no energy`);
                change_mode_recharging_or_become_transpoter(creep);
                return;
            }

            if (!dd.has_destination(creep)) {
                debug(`no dest`);
                change_mode_upgrading(creep);
                return;
            }
            if (!dd.in_range_destination(creep, 3)) {
                debug(`move to dest`);
                var ok = dd.move_to_destination(creep);
            } else {
                debug(`upgrade`);
                let controller = dd.get_dest_obj(creep);
                let ok = creep.upgradeController(dd.get_dest_obj(creep));
                if (ok == OK) {

                } else if (ok == ERR_NOT_ENOUGH_RESOURCES) {
                    debug(`no more energy`);
                    change_mode_recharging_or_become_transpoter(creep);
                } else {
                    debug(`not ok`);
                }
            }
        }
        else {
            debug(`recharging`);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                debug(`full`);
                change_mode_upgrading(creep);
            } else {
                debug(`goto_and_get_energy`);
                let ok = tools.goto_and_get_energy(creep);
                if (!ok) change_mode_recharging_or_become_transpoter(creep);
            }
        }
    }
};

module.exports = roleUpgrader;