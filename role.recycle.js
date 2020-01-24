var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

var roleRecycle = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if (!creep.memory.destination_cleaned) {
            creep.memory.destination_cleaned = true;
            dd.clear_destination(creep);
        }

        if (!dd.has_destination(creep)) {
            debug('!has_destination');
            const id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
                structure.structureType == STRUCTURE_SPAWN);
            dd.set_id_as_destination(creep, id);

            if (!dd.has_destination(creep)) {
                debug('!has_destination');
                if (creep.ticksToLive % 5 == 0)
                    utils.random_move_in_room(creep);
                return;
            }
        }

        {
            debug('go home');
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep);
            } else {
                const spawn = dd.get_dest_obj(creep);
                spawn.recycleCreep(creep);
            }
        }
    }
};

module.exports = roleRecycle;