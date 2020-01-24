var utils = require('utils');
var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

var roleFreeguy = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if (creep.hits < creep.hitsMax && creep.body.some(x => x.type === HEAL)) {
            creep.heal(creep);
        }

        const flag = Game.flags['A'];
        if (!flag) {
            return;
        }
        const pos = flag.pos;
        dd.set_pos_as_destination(creep, pos);
        if (!dd.is_near_destination(creep)) {
            debug('!is_near_destination');
            const move_ok = dd.move_to_destination(creep);
            if (move_ok == ERR_NO_PATH) {
                debug('no path');
            }
        } else {
            let enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,
                { filter: (structure) => structure.structureType == STRUCTURE_TOWER });
            if (!enemy)
                enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (!enemy)
                enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,
                    { filter: (structure) => structure.structureType != STRUCTURE_CONTROLLER });
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
            }
        }
    }
};

module.exports = roleFreeguy;