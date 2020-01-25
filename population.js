var utils = require('utils');

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function energy_of_body(body) {
    let sum = 0;
    body.forEach((v) => {
        switch (v) {
            case WORK: sum += 100; break;
            case MOVE:
            case CARRY: sum += 50; break;
            case ATTACK: sum += 80; break;
            case RANGED_ATTACK: sum += 150; break;
            case HEAL: sum += 250; break;
            case CLAIM: sum += 600; break;
            case TOUGH: sum += 10; break;
        }
    });
    return sum;
}

function largest_possible_body(energy_available, start, repeat, largest_repeat) {
    body = start;
    let i = 0;
    while (energy_of_body(body.concat(repeat)) < energy_available && i < largest_repeat) {
        body = body.concat(repeat);
        i++;
    }
    return body;
}

const ALL_DIRECTIONS = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
const MAX_CREATE_ATTACKER_PATIENCE = 5;

// return true to stop create others
function create_builder(spawn) {
    const role_name = 'builder';
    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[create_builder]: ${msg}`);
    }
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];
    const room_pop = b.population;
    let parts = largest_possible_body(
        b.energy_level.max,
        [WORK, CARRY, MOVE],
        [WORK, CARRY, MOVE],
        15
    );

    let current_number = utils.get_or_zero(room_pop, role_name);
    if (current_number < 8) {
        const storage = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_STORAGE
        });
        if (storage.length === 1) {
            const s = storage[0];
            if (s.store[RESOURCE_ENERGY] < 5000) {
                return false;
            }
        }
        debug(`spawn ${spawn.name} try spawn ${role_name}`);
        const name = role_name[0].toUpperCase() + makeid(3);
        const ok = spawn.spawnCreep(
            parts,
            name,
            {
                memory: { role: role_name, spawn_name: spawn.name, body: parts },
                directions: ALL_DIRECTIONS
            }
        );
        if (ok === OK) {
            debug(`spawn OK`);
            b.reserved_energy = 0;
            console.log('Spawn ' + spawn.name + ' new ' + role_name + ' ' + name);
            return true;
        } else {
            debug(`spawn failed`);

        }
    }
    return false;
}

function create_explorer(spawn) {
    let stop_creating = false;
    const role_name = 'explorer';
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_explorer]: ${msg}`);
    }

    for (let rname in b.neighbor_rooms) {
        const nb = b.neighbor_rooms[rname];
        if (!Game.creeps[nb.explorer_name]) {
            debug(`room ${rname} has no explorer`);


            let parts = [TOUGH, TOUGH, TOUGH, ATTACK, MOVE, MOVE]
            debug(`parts = ${parts}`);
            nb.explorer_name = '';
            const name = role_name[0].toUpperCase() + makeid(3);
            var ok = spawn.spawnCreep(
                parts,
                name,
                {
                    memory: { role: role_name, spawn_name: spawn.name, body: parts, dest_room: rname },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok == ERR_NOT_ENOUGH_ENERGY) {
                debug(`ERR_NOT_ENOUGH_ENERGY, room ${room.name} patience--`);
                b.create_creep_patience--;
                stop_creating = false; //never mind
            } else if (ok === OK) {
                debug(`OK`);
                b.reserved_energy = 0;
                nb.explorer_name = name;
                stop_creating = true;
                break;
            }
        }
    }
    return stop_creating;
}

function create_claimer(spawn) {
    let stop_creating = false;
    const role_name = 'claimer';
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_claimer]: ${msg}`);
    }

    for (let rname in b.neighbor_rooms) {
        const nb = b.neighbor_rooms[rname];
        const room = Game.rooms[rname];
        if (!room) continue;
        const cs = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTROLLER
        });
        if (!cs.length) continue;
        const controller = cs[0];
        if (!controller.my &&
            !(
                controller.reservation &&
                controller.reservation.username === 'Leman' &&
                controller.reservation.ticksToEnd > 2000
            ) &&
            !Game.creeps[nb.claimer_name]) {
            debug(`room ${rname} has no claimer`);

            let parts = largest_possible_body(
                b.energy_level.max,
                [CLAIM, MOVE],
                [CLAIM, MOVE],
                5
            );
            debug(`parts = ${parts}`);
            nb.claimer_name = '';
            const name = role_name[0].toUpperCase() + makeid(3);
            var ok = spawn.spawnCreep(
                parts,
                name,
                {
                    memory: { role: role_name, spawn_name: spawn.name, body: parts, dest_room: rname },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok == ERR_NOT_ENOUGH_ENERGY) {
                debug(`ERR_NOT_ENOUGH_ENERGY, room ${room.name} patience--`);
                b.create_creep_patience--;
                stop_creating = false; //never mind
            } else if (ok === OK) {
                debug(`OK`);
                b.reserved_energy = 0;
                nb.claimer_name = name;
                stop_creating = true;
                break;
            }
        }
    }
    return stop_creating;
}

function create_attacker(spawn) {
    let stop_creating = false;
    const role_name = 'attacker';
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_attacker]: ${msg}`);
    }


    if (!('create_attacker_patience' in b))
        b.create_attacker_patience = 0;
    if (b.create_attacker_patience > 0) {
        debug(`waiting`);
        b.create_attacker_patience--;
        return stop_creating;
    }

    for (let rname in b.neighbor_rooms) {
        const room = Game.rooms[rname];
        if (!room) continue;
        const enemy = room.find(FIND_HOSTILE_CREEPS);
        const enemy_structure = room.find(FIND_HOSTILE_STRUCTURES,
            { filter: (structure) => structure.structureType != STRUCTURE_CONTROLLER });
        if (!enemy.length && !enemy_structure.length) continue;
        {
            debug(`room ${rname} has no attacker`);

            let parts = [MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK];
            const energy_required = energy_of_body(parts);
            debug(`parts = ${parts}`);
            const name = role_name[0].toUpperCase() + makeid(3);
            var ok = spawn.spawnCreep(
                parts,
                name,
                {
                    memory: { role: role_name, spawn_name: spawn.name, body: parts, dest_room: room.name },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok == ERR_NOT_ENOUGH_ENERGY) {
                debug(`ERR_NOT_ENOUGH_ENERGY, room ${room.name} patience--`);
                stop_creating = false; //never mind
                b.reserved_energy = energy_required;
            } else if (ok === OK) {
                debug(`OK`);
                b.create_attacker_patience = MAX_CREATE_ATTACKER_PATIENCE;
                b.reserved_energy = 0;
                stop_creating = true;
                break;
            }
        }
    }
    return stop_creating;
}

function create_miner_and_transpoter(spawn) {
    let stop_creating = false;
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_miner_and_transpoter]: ${msg}`);
    }

    let res_count = 0;
    let miner_count = 0;
    for (let rid in b.res) {
        res_count++;
        const r = b.res[rid];
        if (Game.creeps[r.miner_name])
            miner_count++;
    }

    let need_more_transpoter = false;
    for (let rid in b.res) {
        const r = b.res[rid];
        if (!Game.getObjectById(rid)) continue;
        const pos = r.mining_pos;
        const room_pos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const list = room_pos.lookFor(LOOK_STRUCTURES);
        let container = list.filter((s) => { return s.structureType == STRUCTURE_CONTAINER });
        if (!container.length) continue;
        let c = container[0];
        if (c.store.getFreeCapacity() == 0) {
            need_more_transpoter = true;
            break;
        }
    }

    const transpoter_count = utils.get_or_zero(b.population, 'transpoter');
    let mine_transpoter_ratio = 0.5;
    const need_miner = miner_count < res_count;
    if (transpoter_count < miner_count * mine_transpoter_ratio || (need_more_transpoter && !need_miner)) {
        const parts = largest_possible_body(
            b.energy_level.max,
            [CARRY, CARRY, MOVE],
            [CARRY, CARRY, MOVE],
            10
        );
        const role_name = 'transpoter';
        debug(`spawn ${spawn.name} ${role_name}`);
        const name = role_name[0].toUpperCase() + makeid(3);
        const ok = spawn.spawnCreep(
            parts,
            name,
            {
                memory: { role: role_name, spawn_name: spawn.name, body: parts },
                directions: ALL_DIRECTIONS
            }
        );
        if (ok === OK) {
            debug(`spawn OK`);
            b.reserved_energy = 0;
            debug(`Spawn ${spawn.name} new ${role_name} ${name}`);
            stop_creating = true;
        } else {
            debug(`spawn failed`);
        }
    } else {
        const role_name = 'miner';
        for (let rid in b.res) {
            const r = b.res[rid];
            if (!Game.getObjectById(rid)) continue;
            const name = role_name[0].toUpperCase() + makeid(3);
            const cur_miner = Game.creeps[r.miner_name];
            const no_miner = !cur_miner;
            const miner_dying = !no_miner && !cur_miner.memory.successor && cur_miner.ticksToLive < r.distance_to_spawn + 50;
            if (no_miner || miner_dying) {
                if (no_miner)
                    debug(`res ${rid} has no miner`);
                else if (miner_dying)
                    debug(`res ${rid} has dying miner`);

                const parts = largest_possible_body(
                    b.energy_level.max,
                    [WORK, WORK, CARRY, MOVE],
                    [WORK, WORK, MOVE],
                    2
                );
                const energy_required = energy_of_body(parts);
                debug(`parts = ${parts}`);
                r.miner_name = null;
                var ok = spawn.spawnCreep(
                    parts,
                    name,
                    {
                        memory: { role: role_name, spawn_name: spawn.name, body: parts, mine_id: rid },
                        directions: ALL_DIRECTIONS
                    }
                );
                if (ok == ERR_NOT_ENOUGH_ENERGY) {
                    debug(`ERR_NOT_ENOUGH_ENERGY, room ${room.name} patience--`);
                    b.create_creep_patience--;
                    b.reserved_energy = energy_required;
                    stop_creating = true; //stop creating other creep
                } else if (ok === OK) {
                    debug(`OK`);
                    r.miner_name = name;
                    b.reserved_energy = 0;
                    if (miner_dying) cur_miner.memory.successor = name;
                    stop_creating = true;
                    break;
                }
            }
        }
    }

    return stop_creating;
}

var Population = {
    reproduce_spawn: function (spawn) {
        if (create_attacker(spawn))
            return;
        if (create_miner_and_transpoter(spawn))
            return;
        if (create_explorer(spawn))
            return;
        if (create_claimer(spawn))
            return;
        if (create_builder(spawn))
            return;
    },
    reproduce: function () {
        for (let s in Game.spawns) {
            const sp = Game.spawns[s];
            if (sp.spawning) continue;
            Population.reproduce_spawn(sp);
        }
    },
    run: function () {
        Population.reproduce();
        for (var name in Memory.creeps)
            if (!Game.creeps[name])
                delete Memory.creeps[name];
    },
    create_special: function () {
        const room = Game.rooms['W9S6'];
        let spawns = room.find(FIND_STRUCTURES, { filter: (x) => x.structureType === STRUCTURE_SPAWN && x.my });
        for (let spawn of spawns) {
            const name = 'FGUY' + Math.floor(Math.random() * 100);
            const role_name = 'freeguy';
            const N = 12;
            const parts = Array(N).fill(MOVE).concat(Array(N).fill(ATTACK)).concat(Array(N).fill(HEAL));
            console.log(`require energy : ${energy_of_body(parts)}, we have ${room.energyAvailable}/${room.energyCapacityAvailable}`);
            const ok = spawn.spawnCreep(
                parts,
                name,
                {
                    memory: {
                        role: role_name, spawn_name: spawn.name,
                        body: parts
                    },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok === OK) {
                console.log(`spawn OK`);
                return true;
            } else {
                console.log(`spawn failed: ${ok}`);
            }
        }
    }
};
module.exports = Population;