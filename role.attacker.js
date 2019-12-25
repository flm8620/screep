var tools = require('tools');
var dd = require('destinations');



var roleAttacker = {
    run: function (creep) {
        if (creep.spawning) return;
        const DEBUG_ON = creep.name === 'ARR';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');

        {
            const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (enemy) {
                debug('attack creep');
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
            const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,
                { filter: (structure) => structure.structureType != STRUCTURE_CONTROLLER });
            if (enemy) {
                debug(`attack building ${enemy.id}`);
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
        if (!dd.has_destination(creep)) {
            debug('!dd.has_destination(creep)');
            for (const rname in nbs) {
                if (rname in Game.rooms && Game.rooms[rname].controller && !Game.rooms[rname].controller.my && Game.rooms[rname].controller.owner) {
                    creep.memory.dest_room = rname;

                    let d = new RoomPosition(25, 25, rname);
                    dd.set_pos_as_destination(creep, d);
                    break;
                }
            }
        }

        if (!dd.is_near_destination(creep)) {
            debug('!is_near_destination');
            var move_ok = dd.move_to_destination(creep, DEBUG_ON);
            if (move_ok == ERR_NO_PATH) {
                debug('no path');
            }

        }




    }
};

module.exports = roleAttacker;