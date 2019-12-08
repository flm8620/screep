var tools = require('tools');
var dd = require('destinations');

var roleBuilder = {

    run: function (creep) {
        const DEBUG_ON = creep.name === '';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        debug(`at pos: ${creep.pos.x} ${creep.pos.y} ${creep.pos.roomName}`)
        // //let d = new RoomPosition(12, 46, 'W9S3');
        // let d = new RoomPosition(12, 5, 'W9S4');
        // let ok = creep.moveTo(d, { serializeMemory: false, visualizePathStyle: {} });
        // debug(`ok = ${ok}`)
        // return;

        //let d = new RoomPosition(12, 43, 'W9S3');
        //let d = new RoomPosition(23, 3, 'W9S5');
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (enemy) {
            let p = enemy.pos;
            if(!creep.pos.isNearTo(p)){
                creep.moveTo(p);
            } else {
                creep.attack(enemy);
            }
            if(creep.pos.inRangeTo(p)){
                creep.rangedAttack(enemy);
            }
        }
        let d = new RoomPosition(10, 6, 'W9S4');
        dd.set_pos_as_destination(creep, d);
        if (!dd.has_destination(creep)) {
            debug(`set destination to ${d}`);
            return;
        } else {
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep, DEBUG_ON);
                if (move_ok == ERR_NO_PATH) {
                    debug('no path');
                }

            }
        }
    }
};

module.exports = roleBuilder;