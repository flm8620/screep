var utils = require('utils');

const is_store = (structure) => {
    return structure.structureType == STRUCTURE_EXTENSION ||
        structure.structureType == STRUCTURE_SPAWN ||
        structure.structureType == STRUCTURE_CONTAINER;
}

var dd = {
    pick_id_using_filter: function (creep, find_name, filter) {//return null if empty
        var room = Game.spawns[creep.memory.spawn_name].room;
        var t;
        if (creep.room.name == room.name) {
            t = creep.pos.findClosestByRange(find_name, { filter });
        } else {
            var exit = room.findExitTo(creep.room);
            var exits = room.find(exit);
            var from = exits[0].pos;
            t = from.findClosestByRange(find_name, { filter });
        }
        if (!t) return null;
        return t.id;
    },
    pick_nearest_site_id: function (creep) {
        let filters = [
            [FIND_CONSTRUCTION_SITES, null],
            [FIND_STRUCTURES, (structure) =>
                structure.hits < 0.5 * structure.hitsMax
                && structure.structureType != STRUCTURE_WALL
                && structure.structureType != STRUCTURE_RAMPART],
            [FIND_STRUCTURES, (structure) =>
                structure.hits < 0.8 * structure.hitsMax
                && structure.structureType != STRUCTURE_WALL
                && structure.structureType != STRUCTURE_RAMPART],
            ...[1000, 10000, 100000, 1000000, 10000000].map((x) =>
                [FIND_STRUCTURES, (structure) =>
                    structure.structureType == STRUCTURE_RAMPART && structure.hits < x && structure.hits > 0 ||
                    structure.structureType == STRUCTURE_WALL && structure.hits < x && structure.hits > 0]
            )
        ];
        let id = null;
        for (let f of filters) {
            id = dd.pick_id_using_filter(creep, f[0], f[1]);
            if (id) break;
        }
        return id;
    },
    pick_available_resource_store_id: function (creep) {
        let id = dd.pick_id_using_filter(creep, FIND_TOMBSTONES, (t) => t.store[RESOURCE_ENERGY] > 100);
        if (!id)
            id = dd.pick_id_using_filter(creep, FIND_DROPPED_RESOURCES, (r) => r.amount > 200);
        if (!id)
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
                structure.structureType == STRUCTURE_STORAGE
                && structure.store[RESOURCE_ENERGY] > 0
            );
        if (!id)
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
                is_store(structure) && structure.store[RESOURCE_ENERGY] >= 50
            );

        return id;
    },
    pick_non_full_store_id: function (creep) {
        let id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
            (structure) => (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        );
        if (!id) {
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                (structure) => structure.structureType == STRUCTURE_TOWER && structure.store.getUsedCapacity(RESOURCE_ENERGY) < 0.9 * structure.store.getCapacity(RESOURCE_ENERGY)
            );
        }
        if (!id) {
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                (structure) => structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] < structure.storeCapacity
            );
        }
        return id;
    },
    pick_tower_id: function (creep) {
        var filter = (structure) => {
            return (structure.structureType == STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
        return dd.pick_id_using_filter(creep, FIND_STRUCTURES, filter);
    },
    pick_resource_id_harvester: function (creep) {
        let id_score = [];
        let ids = []
        for (var id in Memory.res) {
            let r = Memory.res[id];
            let res = Game.getObjectById(id);
            if (res.amount < 100)
                continue;
            id_score.push(Math.exp(-r.history_time / 50))
            ids.push(id)
        }
        if (id_score.length === 0) {
            return null;
        }
        let idx = utils.random_idx_with_probability(id_score);
        return ids[idx];
    },
    pick_resource_id: function (creep) {
        let best_rid = '';
        let time_min = 1e10;
        for (var id in Memory.res) {
            let r = Memory.res[id];
            var res = Game.getObjectById(id);
            if (res.energy < 100) {
                continue;
            }
            if (!r.miner_id) continue;
            if (time_min > r.history_time) {
                best_rid = id;
                time_min = r.history_time;
            }
        }
        if (best_rid === '') {
            return null;
        }
        return best_rid;
    },
    pick_controller_id: function (creep) {
        return creep.room.controller.id;
    },
    set_id_as_destination: function (creep, id) {
        dd.clear_destination(creep);
        if (!id) return false;
        creep.memory.dest_id = id;
        var pos = Game.getObjectById(id).pos;
        if (!pos) return false;
        creep.memory.dest_pos = pos;
        //creep.say('go ' + creep.memory.dest_pos.x + ' ' + creep.memory.dest_pos.y);
        return true;
    },
    set_pos_as_destination: function (creep, pos) {
        dd.clear_destination(creep);
        if (!pos) return false;
        creep.memory.dest_id = null;
        creep.memory.dest_pos = pos;
        //creep.say('go ' + creep.memory.dest_pos.x + ' ' + creep.memory.dest_pos.y);
        return true;
    },
    clear_destination: function (creep) {
        creep.memory.dest_id = null;
        creep.memory.dest_pos = null;
    },
    move_to_destination: function (creep, debug_mode, opt) {
        if (!opt) opt = {};
        if (!debug_mode) debug_mode = false;
        const DEBUG_ON = debug_mode || creep.name == 'B3N';
        let debug = function (msg) {
            if (DEBUG_ON)
                console.log(`[${creep.name}]: ${msg}`);
        }
        debug('=== move begin ===');
        const PATH_REUSE = 20;
        const PATH_REUSE_SHORT = 5;
        const MAX_MOVE_PATIENCE = 5;
        if (!creep.memory.dest_pos) return -10000;
        let dest_pos = creep.memory.dest_pos;
        if (!('move_patience' in creep.memory)) creep.memory.move_patience = MAX_MOVE_PATIENCE;

        let last_move_failed = false;
        const last_pos = creep.memory.last_pos_before_move;
        if (last_pos) {
            last_move_failed = creep.pos.x == last_pos.x && creep.pos.y == last_pos.y;
            if (last_move_failed) {// last time, somehow block by other creeps on remembered path
                debug(`last_move_failed`);
                creep.memory.move_patience--;
            } else {
                debug(`last_move_succeed`);
                creep.memory.move_patience = MAX_MOVE_PATIENCE
            }
        }

        // always ignore other creeps except last move failed(probably blocked by creeps)
        opt.ignoreCreeps = !last_move_failed;


        if (!creep.memory.my_path) {
            creep.memory.move_patience = 0;// I need a path now !
            debug(`no path, need a path now !`);
        } else {
            let d1 = creep.memory.my_path.dest;
            let d2 = dest_pos;
            if (d1.x != d2.x || d1.y != d2.y || d1.roomName != d2.roomName) {
                debug(`new dest, need a path now !`);
                creep.memory.move_patience = 0;// I need a path now !
            } else if(creep.memory.my_path.room !== creep.pos.roomName){
                debug(`new room, need a path now !`);
                creep.memory.move_patience = 0;// I need a path now !
            }
        }


        if (creep.memory.move_patience <= 0 || creep.memory.my_path.count_down <= 0) {
            creep.memory.move_patience = MAX_MOVE_PATIENCE
            let path = creep.pos.findPathTo(
                new RoomPosition(dest_pos.x, dest_pos.y, dest_pos.roomName), opt);
            creep.memory.my_path =
                { 
                    path, 
                    dest: dest_pos, 
                    count_down: last_move_failed ? PATH_REUSE_SHORT : PATH_REUSE ,
                    room: creep.pos.roomName
                };

            debug(`refind path length: ${path.length}`);
            if (!path.length) return ERR_NO_PATH;
        } else {
            //console.log(creep.name + ' wait move ' + creep.memory.move_patience);
        }


        //now try to move
        debug(`try to move`);
        let path = creep.memory.my_path.path;
        if (path.length === 0) {
            debug(`path empty`);
            creep.memory.move_patience--;
            return ERR_NO_PATH;
        } else {
            let end = path[path.length - 1];
            if (end.x == creep.pos.x && end.y == creep.pos.y) {
                debug(`path finished`);
                delete creep.memory.my_path;
                return OK;
            }
        }
        let result = creep.moveByPath(creep.memory.my_path.path);
        if (DEBUG_ON)
            creep.room.visual.poly(creep.memory.my_path.path);

        if (result == OK) {
            //so next time we can check whether this move is failed
            creep.memory.last_pos_before_move = creep.pos;
            creep.memory.my_path.count_down--;
            if (last_move_failed) {
                result = ERR_NO_PATH;
            }
        } else {
            delete creep.memory.last_pos_before_move;
        }

        if (result == ERR_NOT_FOUND) {
            console.log(`Creep ${creep.name} has inconsistent path`);
            debug('inconsistent path');
            delete creep.memory.my_path;
        } else if (result == ERR_INVALID_ARGS) {
            console.log(`Creep ${creep.name} moveByPath ERR_INVALID_ARGS`);
            debug('ERR_INVALID_ARGS');
            delete creep.memory.my_path;
        } else if (result == ERR_TIRED) {
            //never mind
        } else if (result == ERR_NO_BODYPART) {
            console.log(`Creep ${creep.name} has no move body`);
        }
        return result;
    },
    in_range_destination: function (creep, range) {
        //console.log(JSON.stringify(creep.name));
        if (creep.memory.dest_pos)
            return creep.pos.inRangeTo(new RoomPosition(creep.memory.dest_pos.x, creep.memory.dest_pos.y, creep.memory.dest_pos.roomName), range);
        else
            return false;
    },
    is_near_destination: function (creep) {
        //console.log(creep.name);
        if (creep.memory.dest_pos)
            return creep.pos.isNearTo(new RoomPosition(creep.memory.dest_pos.x, creep.memory.dest_pos.y, creep.memory.dest_pos.roomName));
        else
            return false;
    },
    is_at_destination: function (creep) {
        //console.log(creep.name);
        if (creep.memory.dest_pos)
            return creep.pos.isEqualTo(new RoomPosition(creep.memory.dest_pos.x, creep.memory.dest_pos.y, creep.memory.dest_pos.roomName));
        else
            return false;
    },
    get_dest_obj: function (creep) {
        return Game.getObjectById(creep.memory.dest_id);
    },
    has_destination: function (creep) {
        return creep.memory.dest_pos != null;
    }
}

module.exports = dd;