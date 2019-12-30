var dd = require('destinations');

var roleRecycle = {
    run: function (creep) {
        if (creep.spawning) return;
        const DEBUG_ON = creep.name === '';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
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
                utils.random_move(creep);
                return;
            }
        }

        {
            debug('go home');
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep, DEBUG_ON);
            } else {
                const spawn = dd.get_dest_obj(creep);
                spawn.recycleCreep(creep);
            }
        }
    }
};

module.exports = roleRecycle;