var utils = require('utils');
var dd = require('destinations');
const db = require('debug_name');
const debug = db.log;

function remove_reservation(creep) {
    const id = creep.memory.reserved_id;
    let reservation = Memory.transpoter_reservation[id];
    if (!reservation) return;
    delete reservation[creep.name];
    delete creep.memory.reserved_id;
}

function transpoter_pick_target(creep) {
    dd.clear_destination(creep);
    creep.memory.patience = PATIENCE_MAX;
    const used_capa = creep.store.getUsedCapacity();
    const used_capa_energy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
    const free_capa = creep.store.getFreeCapacity();
    const bname = Game.spawns[creep.memory.spawn_name].room.name;
    const b = Memory.bases[bname];
    const rooms_search = [bname].concat(Object.keys(b.neighbor_rooms));
    const score_id = [];
    for (const rname of rooms_search) {
        const room = Game.rooms[rname];
        if (!room) continue;
        if (room.controller && room.controller.owner && !room.controller.my) continue;

        const register_target = function (target_id, target_amount, path_length) {
            const reserve = Memory.transpoter_reservation[target_id];
            if (reserve)
                for (const creep_name in reserve)
                    target_amount -= reserve[creep_name].amount;

            if (target_amount <= 0) return;
            const score = Math.min(free_capa, target_amount) / path_length;
            score_id.push({ id: target_id, score, goto_store: false });
        };

        for (const e of room.find(FIND_TOMBSTONES)) {
            const path_length = utils.distance_between_pos(creep.pos, e.pos);
            register_target(e.id, e.store.getUsedCapacity(), path_length);
        }
        for (const e of room.find(FIND_DROPPED_RESOURCES)) {
            const path_length = utils.distance_between_pos(creep.pos, e.pos);
            register_target(e.id, e.amount, path_length);
        }
        for (const e of room.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER })) {
            const path_length = utils.distance_between_pos(creep.pos, e.pos);
            register_target(e.id, e.store.getUsedCapacity(), path_length);
        }
        let found = false;
        if (used_capa == used_capa_energy) {
            for (const t of room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.store.getUsedCapacity(RESOURCE_ENERGY) < 500
            })) {
                const path_length = utils.distance_between_pos(creep.pos, t.pos);
                const score = Math.min(used_capa_energy, t.store.getFreeCapacity(RESOURCE_ENERGY)) / path_length;
                score_id.push({ id: t.id, score, goto_store: true });
                found = true;
            }
            if (!found)
                for (const t of room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                        s.structureType == STRUCTURE_SPAWN) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })) {
                    const path_length = utils.distance_between_pos(creep.pos, t.pos);
                    const score = Math.min(used_capa_energy, t.store.getFreeCapacity(RESOURCE_ENERGY)) / path_length;
                    score_id.push({ id: t.id, score, goto_store: true });
                    found = true;
                }
            if (!found)
                for (const t of room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_STORAGE) && s.store.getFreeCapacity() > 0
                })) {
                    const path_length = utils.distance_between_pos(creep.pos, t.pos);
                    const score = Math.min(used_capa_energy, t.store.getCapacity()) / path_length;
                    score_id.push({ id: t.id, score, goto_store: true });
                }
        }
        else
            for (const t of room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_STORAGE) && s.store.getFreeCapacity() > 0
            })) {
                const path_length = utils.distance_between_pos(creep.pos, t.pos);
                const score = Math.min(used_capa_energy, t.store.getCapacity()) / path_length;
                score_id.push({ id: t.id, score, goto_store: true });
            }
    }
    let id = null;
    let goto_store = false;
    let max_score = 0;
    for (const s_id of score_id) {
        if (s_id.score > max_score) {
            max_score = s_id.score;
            goto_store = s_id.goto_store;
            id = s_id.id;
        }
    }

    if (id && !goto_store) {
        if (!Memory.transpoter_reservation[id]) Memory.transpoter_reservation[id] = {};
        let reservation = Memory.transpoter_reservation[id];
        reservation[creep.name] = { amount: free_capa };
        creep.memory.reserved_id = id;
    }

    return { id, goto_store };
}

function change_mode(creep) {
    dd.clear_destination(creep);
    const result = transpoter_pick_target(creep);
    creep.memory.goto_store = result.goto_store;
    if (!result.id)
        return false;
    if (result.goto_store) {
        creep.say('store');
    } else {
        creep.say('take');
    }

    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, result.id);
}

const PATIENCE_MAX = 20;
var roleTranspoter = {
    run: function (creep) {
        if (creep.spawning) return;
        db.set_creep_name(creep.name);
        debug('====== round begin ======');

        if ('sleep' in creep.memory && creep.memory.sleep > 0) {
            debug(`sleep ${creep.memory.sleep}`);
            if (creep.memory.sleep % 5 == 0)
                utils.random_move(creep);
            creep.memory.sleep--;
            return;
        }

        if (!dd.has_destination(creep)) {
            debug('!has_destination, change_mode');
            change_mode(creep);
            if (!dd.has_destination(creep)) {
                debug('!has_destination');
                if (creep.ticksToLive % 5 == 0)
                    utils.random_move(creep);
                creep.memory.sleep = 10;
                return;
            }
        }

        if (!creep.memory.goto_store) {//taking
            debug('really taking');
            if (creep.memory.patience <= 0) {
                debug('no patience');
                dd.clear_destination(creep);
                return;
            }
            if (!dd.is_near_destination(creep)) {
                debug('!is_near_destination');
                var move_ok = dd.move_to_destination(creep);
                if (move_ok == ERR_NO_PATH) {
                    creep.memory.patience--;
                    if (creep.memory.patience < PATIENCE_MAX)
                        creep.say(creep.memory.patience);
                }

            } else {
                debug('try pickup');
                const stuff = dd.get_dest_obj(creep);
                if (stuff) {
                    let pick_ok = creep.pickup(stuff);
                    if (pick_ok == OK) {
                        debug('pickup OK');
                        remove_reservation(creep);
                    } else if (pick_ok == ERR_INVALID_TARGET) {
                        debug('try withdraw');
                        let withdraw_ok = -1;
                        for (let name in stuff.store) {
                            withdraw_ok = creep.withdraw(stuff, name);
                            break;
                        }
                        if (withdraw_ok == OK) {
                            remove_reservation(creep);
                            debug('withdraw OK');
                        } else {
                            debug('withdraw failed');
                        }
                    } else {
                        debug(`pickup not OK: ${pick_ok}`);
                    }
                }
                dd.clear_destination(creep);
            }
        }

        if (creep.memory.goto_store) {//storing
            debug('really storing');

            if (!dd.has_destination(creep)) {
                debug('!has_destination');
                return;
            }

            if (!dd.is_near_destination(creep)) {
                dd.move_to_destination(creep);
            } else {
                const store = dd.get_dest_obj(creep);
                if (store) {
                    for (let name in creep.store) {
                        let store_ok = creep.transfer(store, name);
                        if (store_ok == OK) {
                            debug('store OK');
                        } else {
                            debug(`store not OK: ${store_ok}`);
                        }
                    }
                }
                dd.clear_destination(creep);
            }
        }
    }
};

module.exports = roleTranspoter;