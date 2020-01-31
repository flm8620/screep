var dd = require('destinations');
const db = require('debug_name');
const utils = require('utils');
const debug = db.log;

var roleExplorer = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if (utils.is_at_border(creep)) {
            debug(`move_out_of_border from ${creep.pos.roomName}`);
            utils.move_out_of_border(creep);
            return;
        }

        if (utils.attack_enemy(creep))
            return;

        if (creep.pos.roomName === creep.memory.dest_room) {
            debug('random_move_in_room');
            utils.random_move_in_room(creep);
            return;
        }

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
};

module.exports = roleExplorer;