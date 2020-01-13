
var weapon = {
    run: function (tower) {
        const DEBUG_ON = false;
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${tower.id}]: ${msg}`);
        }


        debug(`tower working, sleep_countdown=${Memory.tower_sleep_countdown}`);
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
            return true;
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
                        return true;
                }
            }
        }
        return false;
    }
}

module.exports = weapon;