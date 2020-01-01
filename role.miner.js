var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

function set_mine_as_destination(creep) {
    dd.clear_destination(creep);
    const sp = Game.spawns[creep.memory.spawn_name];
    const b = Memory.bases[sp.room.name];
    const i = creep.memory.mine_id;
    if (!i) {
        debug(`no mine_id`);
        creep.memory.role = 'recycle';
        return;
    }
    debug(`source ${i} is mined by ${creep.name}`);
    const mining_pos = b.res[i].mining_pos;
    debug(`set res ${i} to creep ${creep.id}`);

    return dd.set_pos_as_destination(creep, mining_pos);
}

var roleMiner = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');
        if (!dd.has_destination(creep)) {
            debug('!has_destination, set_mine_as_destination');
            set_mine_as_destination(creep);
            return;
        }

        if (!dd.is_at_destination(creep)) {
            var move_ok = dd.move_to_destination(creep);
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
            var i = creep.memory.mine_id;
            var s = Game.getObjectById(i);
            let mine_ok = creep.harvest(s);

        }
    }

};

module.exports = roleMiner;