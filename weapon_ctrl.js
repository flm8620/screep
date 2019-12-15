const MAX_SLEEP_TIME = 20;
const MAX_SLEEP_COUNTDOWN = 50;
var weapon = {
    run: function (tower) {
        const DEBUG_ON = false;
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${tower.id}]: ${msg}`);
        }
        if (!('tower_sleep_countdown' in Memory)) Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
        if (!('tower_sleeped' in Memory)) Memory.tower_sleeped = 0;
        if (Memory.tower_sleep_countdown == 0) {
            Memory.tower_sleeped++;
            debug(`tower slept ${Memory.tower_sleeped}`);
            if (Memory.tower_sleeped > MAX_SLEEP_TIME) {
                Memory.tower_sleeped = 0;
                Memory.tower_sleep_countdown = 1;
            }
            return;
        }

        Memory.tower_sleep_countdown--;
        debug(`tower working, sleep_countdown=${Memory.tower_sleep_countdown}`);
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
            Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
        } else {
            var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) =>
                    structure.hits < structure.hitsMax - 1000
                    && structure.structureType != STRUCTURE_WALL
                    && structure.structureType != STRUCTURE_RAMPART
            });
            if (closestDamagedStructure) {
                if (closestDamagedStructure.pos.inRangeTo(tower, 6)) {
                    let ok = tower.repair(closestDamagedStructure);
                    if (ok == OK)
                        Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
                }
            }
        }
    }
}

module.exports = weapon;