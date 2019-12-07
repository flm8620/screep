var tools = require('tools');
var dd = require('destinations');


function change_mode_mining(creep) {
    dd.clear_destination(creep);
    console.log('mine')
    creep.say('start');
    var i = creep.memory.mine_index;
    if (!i) {
        for (let rid in Memory.res) {
            let r = Memory.res[rid];
            if (!r.miner_id) {
                creep.memory.mine_index = rid;
                i = rid;
            }
        }
    }
    var r = Game.getObjectById(i);
    if (!r) return;
    console.log(`source ${i} is mined by ${creep.name}`);
    Memory.res[i].miner_id = creep.id;
    var mining_pos = Memory.res[i].mining_pos;

    console.log('set res ' + i + ' to creep ' + creep.id);
    return dd.set_pos_as_destination(creep, mining_pos);
}

const PATIENCE_MAX = 20;
var roleMiner = {
    run: function (creep) {
        if (creep.spawning) return;
        if (!dd.has_destination(creep)) {
            change_mode_mining(creep);
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
            var i = creep.memory.mine_index;
            var s = Game.getObjectById(i);
            let mine_ok = creep.harvest(s);

        }
    }

};

module.exports = roleMiner;