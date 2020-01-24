const db = require('debug_name');
const debug = db.log;

var dd = {
    pick_id_using_filter: function (creep, find_name, filter, nb_room = true) {
        debug(`pick_id_using_filter`);
        var base_room = Game.spawns[creep.memory.spawn_name].room;
        const base = Memory.bases[base_room.name];
        let rooms_search = [base_room.name];
        if (nb_room)
            rooms_search = rooms_search.concat(Object.keys(base.neighbor_rooms));;
        const length_obj = [];
        for (const rname of rooms_search) {
            debug(`searching room ${rname}`);
            const room = Game.rooms[rname];
            if (!room) continue;
            let start_length = 0;
            let pos_start = null;
            if (creep.room.name === rname) {
                pos_start = creep.pos;
            } else {
                const route = Game.map.findRoute(creep.room.name, rname);

                if (!route.length) {
                    debug(`no route`);
                    continue;
                }
                if (route.length >= 2) {
                    start_length += (route.length - 1) * 50;
                }
                const exit = room.findExitTo(creep.room);
                pos_start = room.find(exit)[0]
            }
            const t = pos_start.findClosestByPath(find_name, { filter });
            if (!t) {
                debug(`nothing found`);
                continue;
            }
            const path_length = PathFinder.search(pos_start, { pos: t.pos, range: 1 }).path.length + start_length;
            debug(`found ${t.id} with length ${path_length}`);
            length_obj.push({ l: path_length, id: t.id });
        }
        let id = null;
        let min_length = 99999;
        for (const l_id of length_obj) {
            if (l_id.l < min_length) {
                min_length = l_id.l;
                id = l_id.id;
            }
        }
        return id;
    },
    pick_nearest_site_id_for_builder: function (creep) {
        const reservation = Memory.builder_reservation;
        let still_need = function (structure) {
            const id = structure.id;
            const reserve = reservation[id];
            if (!reserve) return true;
            target_amount = structure.hitsMax - structure.hits;
            for (const creep_name in reserve)
                target_amount -= reserve[creep_name].amount * 100 /*repair*/;
            return target_amount > 0;
        };
        let filters = [
            [FIND_MY_STRUCTURES, (structure) =>
                structure.hits < 0.1 * structure.hitsMax
                && structure.hits < 500
                && still_need(structure), true],
            [FIND_MY_CONSTRUCTION_SITES, null, true],
            [FIND_STRUCTURES, (structure) =>
                structure.hits < 0.6 * structure.hitsMax
                && structure.structureType != STRUCTURE_WALL
                && structure.structureType != STRUCTURE_RAMPART
                && (structure.my || structure.structureType == STRUCTURE_ROAD)
                && still_need(structure), true],
            [FIND_STRUCTURES, (structure) =>
                structure.hits < 0.9 * structure.hitsMax
                && structure.structureType != STRUCTURE_WALL
                && structure.structureType != STRUCTURE_RAMPART
                && (structure.my || structure.structureType == STRUCTURE_ROAD)
                && still_need(structure), false],
            ...[1000, 10000, 100000, 1000000].map((x) =>
                [FIND_MY_STRUCTURES, (structure) =>
                    (structure.structureType == STRUCTURE_RAMPART ||
                        structure.structureType == STRUCTURE_WALL)
                    && structure.hits < x && structure.hits > 0
                    && still_need(structure), true
                ]
            )
        ];
        let id = null;
        for (let f of filters) {
            id = dd.pick_id_using_filter(creep, f[0], f[1], f[2]);
            if (id) break;
        }
        return id;
    },
    pick_available_energy_store_id: function (creep) {
        const room = Game.spawns[creep.memory.spawn_name].room;
        const reserved = Memory.bases[room.name].reserved_energy;
        let id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
            structure.structureType == STRUCTURE_STORAGE
            && structure.store[RESOURCE_ENERGY] > 100,
            true
        );
        if (!id) {
            const storage = room.find(FIND_MY_STRUCTURES, {
                filter: (structure) =>
                    structure.structureType === STRUCTURE_STORAGE
            });
            if (storage.length === 0) {
                if (!id)
                    if (!reserved || reserved < room.energyAvailable)
                        id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
                            (
                                structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_SPAWN
                            ) &&
                            structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 50,
                            true
                        );
                if (!id) {
                    id = dd.pick_id_using_filter(creep, FIND_STRUCTURES, (structure) =>
                        (
                            structure.structureType == STRUCTURE_CONTAINER
                        ) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 50,
                        true
                    );
                }
            }
        }
        return id;
    },
    pick_non_full_store_id: function (creep, resource_is_energy = true) {
        let id = null;
        if (resource_is_energy) {
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) < 500;
                }
            );
            if (!id)
                id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                    (structure) => (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
                    false
                );
            if (!id)
                id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                    (structure) => structure.structureType == STRUCTURE_TOWER &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) < 0.9 * structure.store.getCapacity(RESOURCE_ENERGY)
                );
        }
        if (!id)
            id = dd.pick_id_using_filter(creep, FIND_STRUCTURES,
                (structure) => structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity() > 0,
                false
            );
        return id;
    },
    pick_tower_id: function (creep) {
        var filter = (structure) => {
            return (structure.structureType == STRUCTURE_TOWER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
        return dd.pick_id_using_filter(creep, FIND_STRUCTURES, filter);
    },
    pick_controller_id: function (creep) {
        return Game.spawns[creep.memory.spawn_name].room.controller.id;
    },
    set_id_as_destination: function (creep, id) {
        dd.clear_destination(creep);
        if (!id) return false;
        var pos = Game.getObjectById(id).pos;
        if (!pos) return false;
        creep.memory.dest_id = id;
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
    move_to_destination: function (creep, debug_mode, opt) {
        if (!opt) opt = {};
        if (!debug_mode) debug_mode = false;
        debug('=== move begin ===');
        const PATH_REUSE = 20;
        const PATH_REUSE_SHORT = 5;
        const MAX_MOVE_PATIENCE = 5;
        if (!creep.memory.dest_pos) return -10000;
        if (creep.memory.dest_id && !Game.getObjectById(creep.memory.dest_id)) {
            debug('move target disappeared !');
            dd.clear_destination(creep);
            return -10001;
        }

        let dest_pos = creep.memory.dest_pos;
        if (!('move_patience' in creep.memory)) creep.memory.move_patience = MAX_MOVE_PATIENCE;

        let last_move_failed = false;
        const last_pos = creep.memory.last_pos_before_move;
        if (last_pos) {
            last_move_failed = creep.pos.x == last_pos.x && creep.pos.y == last_pos.y && !creep.memory.last_move_tired;
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
            } else if (creep.memory.my_path.room !== creep.pos.roomName) {
                debug(`new room, need a path now !`);
                creep.memory.move_patience = 0;// I need a path now !
            }
        }


        if (creep.memory.move_patience <= 0 || creep.memory.my_path.count_down <= 0) {
            creep.memory.move_patience = MAX_MOVE_PATIENCE
            const p = creep.pos;
            debug(`findPath from ${p.x} ${p.y} ${p.roomName} To ${dest_pos.x} ${dest_pos.y} ${dest_pos.roomName}`);
            if (p.roomName !== dest_pos.roomName && opt.range) opt.range = 0;
            let path = p.findPathTo(
                new RoomPosition(dest_pos.x, dest_pos.y, dest_pos.roomName), opt);

            creep.memory.my_path =
            {
                path,
                dest: dest_pos,
                count_down: last_move_failed ? PATH_REUSE_SHORT : PATH_REUSE,
                room: creep.pos.roomName
            };

            debug(`refind path length: ${path.length}`);
            if (!path.length) return ERR_NO_PATH;
        } else {
            //console.log(creep.name + ' wait move ' + creep.memory.move_patience);
        }


        //now try to move
        debug(`try to move`);
        //so next time we can check whether this move is failed
        creep.memory.last_pos_before_move = creep.pos;
        creep.memory.last_move_tired = false;

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
        if (db.DEBUG_ON)
            creep.room.visual.poly(creep.memory.my_path.path);

        if (result == OK) {
            creep.memory.my_path.count_down--;
            if (last_move_failed) {
                result = ERR_NO_PATH;
            }
        }

        creep.memory.last_move_tired = result == ERR_TIRED;

        if (result == ERR_NOT_FOUND) {
            //console.log(`Creep ${creep.name} has inconsistent path`);
            debug('inconsistent path');
            delete creep.memory.my_path;
        } else if (result == ERR_INVALID_ARGS) {
            console.log(`Creep ${creep.name} moveByPath ERR_INVALID_ARGS`);
            debug('ERR_INVALID_ARGS');
            delete creep.memory.my_path;
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
    clear_destination: function (creep) {
        creep.memory.dest_id = null;
        creep.memory.dest_pos = null;
    },
    get_dest_obj: function (creep) {
        return Game.getObjectById(creep.memory.dest_id);
    },
    has_destination: function (creep) {
        return creep.memory.dest_pos != null;
    }
}

module.exports = dd;