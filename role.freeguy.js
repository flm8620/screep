var utils = require('utils');
var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

var roleFreeguy = {

    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');
        if (false) {
            if (creep.memory.building) {
                let site = Game.getObjectById('5ded0c4cad2e8d8b0fd214b9');
                debug(`build`);
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    debug(`building = false`);
                    creep.memory.building = false;
                } else {
                    if (!creep.pos.inRangeTo(site, 3)) {
                        debug('not in range');
                        let ok = creep.moveTo(site);
                        if (ok !== OK) {
                            debug('no path');
                        }
                    } else {
                        creep.build(site);
                    }
                }
            } else {
                debug(`harvest`);
                let source = Game.getObjectById('5bbcac629099fc012e635600');
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    debug(`building = true`);
                    creep.memory.building = true;
                } else if (!creep.pos.isNearTo(source)) {
                    debug('!is_near_destination');
                    let ok = creep.moveTo(source);
                    if (ok !== OK) {
                        debug('no path');
                    }
                } else {
                    creep.harvest(source);
                }
            }
            return;
        }

        // //let d = new RoomPosition(12, 46, 'W9S3');
        // let d = new RoomPosition(12, 5, 'W9S4');
        // let ok = creep.moveTo(d, { serializeMemory: false, visualizePathStyle: {} });
        // debug(`ok = ${ok}`)
        // return;

        //let d = new RoomPosition(12, 43, 'W9S3');
        //let d = new RoomPosition(23, 3, 'W9S5');
        if (false) {
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
            }
            return;
        }
        //let d = new RoomPosition(16, 25, 'W8S5');
        let d = new RoomPosition(33, 19, 'W9S3');
        //let d = new RoomPosition(5, 39, 'W8S3');
        dd.set_pos_as_destination(creep, d);
        if (!dd.has_destination(creep)) {
            debug(`set destination to ${d}`);
            return;
        } else {
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

module.exports = roleFreeguy;