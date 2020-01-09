var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

var roleClaimer = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if (creep.memory.dest_room == creep.pos.roomName) {
            if (!creep.memory.dest_id) {
                const cs = Game.rooms[creep.pos.roomName].find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTROLLER
                });
                if (!cs.length) {
                    debug(`room has no controller`);
                    return;
                }
                const controller = cs[0];
                dd.set_id_as_destination(creep, controller.id);
            } else {
                if (!dd.is_near_destination(creep)) {
                    debug('!is_near_destination');
                    var move_ok = dd.move_to_destination(creep);
                    if (move_ok == ERR_NO_PATH) {
                        debug('no path');
                    }
                } else {
                    const controller = dd.get_dest_obj(creep);
                    
                    if (controller.owner) {
                        if (!controller.my) {
                            const ok = creep.attackController(controller);
                            debug(`attackController: ${ok}`);
                        }
                        else {
                            const ok = creep.upgradeController(controller);
                            debug(`upgradeController: ${ok}`);
                        }
                    } else {
                        const ok = creep.reserveController(controller);
                        debug(`reserveController: ${ok}`);
                    }
                }
            }
        } else {
            if (!dd.has_destination(creep)) {
                debug(`pick room`);
                let d = new RoomPosition(25, 25, creep.memory.dest_room);
                dd.set_pos_as_destination(creep, d);
            }
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep);
                if (move_ok == ERR_NO_PATH) {
                    debug('no path');
                }
            }
        }
    }
};

module.exports = roleClaimer;