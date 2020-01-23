var dd = require('destinations');
const db = require('debug_name');
const utils = require('utils');
const debug = db.log;

var roleAttacker = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if (utils.is_at_border(creep)) {
            debug(`move_out_of_border from ${creep.pos.roomName}`);
            utils.move_out_of_border(creep);
            return;
        }


        if (creep.hits < creep.hitsMax && creep.body.some(x => x.type === HEAL)) {
            creep.heal(creep);
        }

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

        if (creep.pos.roomName === creep.memory.dest_room) {
            if(creep.ticksToLive % 5 == 0)
                utils.random_move_in_room(creep);
            return;
        }

        if (!dd.has_destination(creep)) {
            debug('!dd.has_destination(creep)');
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

module.exports = roleAttacker;