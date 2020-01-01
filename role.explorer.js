var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

var roleExplorer = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');
        {
            const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (enemy) {
                let p = enemy.pos;
                if (!creep.pos.isNearTo(p)) {
                    creep.moveTo(p);
                } else {
                    creep.attack(enemy);
                }
                if (creep.pos.inRangeTo(p)) {
                    creep.rangedAttack(enemy);
                }
                return;
            }
        }
        {
            const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
            if (enemy) {
                let p = enemy.pos;
                if (!creep.pos.isNearTo(p)) {
                    creep.moveTo(p);
                } else {
                    creep.attack(enemy);
                }
                if (creep.pos.inRangeTo(p)) {
                    creep.rangedAttack(enemy);
                }
                return;
            }
        }

        const base = Memory.bases[Game.spawns[creep.memory.spawn_name].room.name];
        const nbs = base.neighbor_rooms;
        if (!creep.memory.dest_room) {
            for (const rname in nbs) {
                const nb = nbs[rname];
                debug(`room ${rname}`);
                if (!(rname in Game.rooms) || !Game.getObjectById(nb.explorer_id)) {
                    debug(`pick room`);
                    nb.explorer_id = creep.id;
                    creep.memory.dest_room = rname;

                    let d = new RoomPosition(25, 25, rname);
                    dd.set_pos_as_destination(creep, d);
                    break;
                }
            }
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