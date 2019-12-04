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
        if (creep.spawning) return;
        if (creep.memory.upgrading) {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                change_mode_recharging_or_become_transpoter(creep);
                return;
            }

            if (!dd.has_destination(creep)) {
                change_mode_upgrading(creep);
                return;
            }
            if (!dd.in_range_destination(creep, 3)) {
                var ok = dd.move_to_destination(creep);
            } else {
                let controller = dd.get_dest_obj(creep);
                let ok = creep.upgradeController(dd.get_dest_obj(creep));
                if (ok == OK) {

                } else if (ok == ERR_NOT_ENOUGH_RESOURCES) {
                    change_mode_recharging_or_become_transpoter(creep);
                } else {
                    console.log('upgrader line 34');
                }
            }
        }
        else {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                change_mode_upgrading(creep);
            } else {
                let ok = tools.goto_and_get_energy(creep);
                if (!ok) change_mode_recharging_or_become_transpoter(creep);
            }
        }
    }
};

module.exports = roleUpgrader;