var dd = require('destinations');

const PATIENCE_MAX = 100;

function change_mode_mining(creep, debug = false) {
    dd.clear_destination(creep);
    const sp = Game.spawns[creep.memory.spawn_name];
    const b = Memory.bases[sp.room.name];
    var i = creep.memory.mine_index;
    if (!i) {
        if (debug) 
            console.log(`no mine_index`);
        for (let rid in b.res) {
            let r = b.res[rid];
            if (!r.miner_id) {
                creep.memory.mine_index = rid;
                i = rid;
            }
        }
    }
    if (!i) {
        if (!('patience' in creep.memory)) creep.memory.patience = PATIENCE_MAX;
        creep.memory.patience--;
        console.log(`miner ${creep.name} has nothing to mine`);
        if (creep.memory.patience < 0) {
            creep.suicide();
        }
    }
    console.log(`source ${i} is mined by ${creep.name}`);
    b.res[i].miner_id = creep.id;
    var mining_pos = b.res[i].mining_pos;

    console.log('set res ' + i + ' to creep ' + creep.id);
    return dd.set_pos_as_destination(creep, mining_pos);
}

var roleMiner = {
    run: function (creep) {
        if (creep.spawning) return;

        const DEBUG_ON = creep.name === 'MBG';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('====== round begin ======');
        if (!dd.has_destination(creep)) {
            debug('!has_destination, change_mode_mining');
            change_mode_mining(creep, DEBUG_ON);
            return;
        }

        if (!dd.is_at_destination(creep)) {
            var move_ok = dd.move_to_destination(creep, DEBUG_ON);
        } else {//mine
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                let list = creep.room.lookForAt(LOOK_STRUCTURES, creep.pos);
                let container = list.filter((structure) => { return structure.structureType == STRUCTURE_CONTAINER });

                if (container.length == 1 && container[0].hits < 0.98 * container[0].hitsMax) {
                    let c = container[0];
                    let repair_ok = creep.repair(c);
                } else {
                    list = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos);
                    let site = list.filter((site) => { return site.structureType == STRUCTURE_CONTAINER });

                    if (site.length == 1) {
                        creep.build(site[0]);
                        return;
                    }

                    creep.drop(RESOURCE_ENERGY);
                }
            }
            var i = creep.memory.mine_index;
            var s = Game.getObjectById(i);
            let mine_ok = creep.harvest(s);

        }
    }

};

module.exports = roleMiner;