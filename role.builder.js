var utils = require('utils');
var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

function change_mode_building(creep) {
    dd.clear_destination(creep);
    creep.memory.building = true;
    let site = dd.pick_nearest_site_id(creep);
    if (!site) {
        debug(`no build site, try update`);
        site = dd.pick_controller_id(creep);
        if (!site) {
            creep.say('no build');
            utils.random_move(creep);
        } else {
            creep.say('update');
        }
    } else {
        debug(`get build id ${site}`);
        creep.say('build');
    }
    var ok = dd.set_id_as_destination(creep, site);
}
function change_mode_recharging(creep) {
    creep.say('reload');
    creep.memory.building = false;
    dd.clear_destination(creep);
    if (!dd.set_id_as_destination(creep, dd.pick_available_energy_store_id(creep))) {
        // random move
        utils.random_move(creep);
    }
}

var roleBuilder = {
    run: function (creep) {
        db.set_creep_name(creep.name);
        debug('====== round begin ======');
        if (creep.spawning) return;
        if (utils.is_at_border(creep)) {
            debug(`move_out_of_border from ${creep.pos.roomName}`);
            utils.move_out_of_border(creep);
            return;
        }
        if (creep.memory.building) {
            debug('try building');
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                debug('no energy');
                change_mode_recharging(creep);
            } else if (!dd.has_destination(creep)) {
                debug('no destination');
                change_mode_building(creep);
            }
        } else {
            debug('try charging');
            if (creep.store.getFreeCapacity() == 0) {
                debug('full');
                change_mode_building(creep);
            }
            if (!dd.has_destination(creep)) {
                debug('no destination');
                change_mode_recharging(creep);
            }
        }
        if (creep.memory.role !== 'builder') return;


        if (creep.memory.building) {
            debug('really building');
            if (!dd.in_range_destination(creep, 3)) {
                debug('moving');
                dd.move_to_destination(creep, false, { range: 3 });
            } else {
                debug('try struct');
                const struct = dd.get_dest_obj(creep);
                let build_ok = 9999;
                if (struct) {
                    debug(`got struct ${struct.id}`);
                    if (struct.structureType === STRUCTURE_CONTROLLER) {
                        build_ok = creep.upgradeController(struct);
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
                    dd.clear_destination(creep);
                }
                if (build_ok == OK) {
                    debug('build OK');
                } else if (build_ok == ERR_NOT_ENOUGH_RESOURCES) {
                    debug('build ERR_NOT_ENOUGH_RESOURCES');
                    change_mode_recharging(creep);
                } else {//structure may be removed
                    debug('build other error');
                    change_mode_building(creep);
                }
            }

        }
        else {//recharging
            debug('really charging');

            let something = dd.get_dest_obj(creep);
            if (!something) {
                dd.clear_destination(creep);
                return
            }
            if (!creep.pos.isNearTo(something.pos)) {
                debug('move_to_destination');
                dd.move_to_destination(creep);
            } else {
                let ok = creep.withdraw(something, RESOURCE_ENERGY);
                if (ok == OK) {
                } else if (ok == ERR_NOT_IN_RANGE) {
                } else if (ok == ERR_NOT_ENOUGH_RESOURCES) {
                } else if (ok == ERR_INVALID_TARGET) {
                    ok = creep.pickup(something);
                }
                dd.clear_destination(creep);
            }
        }
    }
};

module.exports = roleBuilder;