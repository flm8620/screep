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
const MAX_CREATE_CREEP_PATIENCE = 30;
const MAX_CREATE_ATTACKER_PATIENCE = 5;


// return true to stop create others
function create_creep(spawn, role_name, number) {
    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[create_creep]: ${msg}`);
    }
    const room = spawn.room;
    const rname = room.name;
    const b = Memory.bases[rname];
    const room_pop = b.population;
    let energyCapacityAvailable = room.energyCapacityAvailable;
    let parts = largest_possible_body(energyCapacityAvailable,
        [WORK, CARRY, MOVE],
        [WORK, CARRY, MOVE],
        10
    );
    if (role_name === 'freeguy') {
        parts = [WORK, WORK, WORK, WORK, WORK,
            CARRY, CARRY, CARRY, CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (role_name === 'builder') {
        parts = largest_possible_body(energyCapacityAvailable,
            [WORK, CARRY, MOVE],
            [WORK, CARRY, MOVE],
            8
        );
    }

    let current_number = utils.get_or_zero(room_pop, role_name);
    if (current_number < number) {
        debug(`spawn ${spawn.name} try spawn ${role_name}`);
        var ok = spawn.spawnCreep(parts, 'asdasdasdasdasd', { dryRun: true });
        if (ok === OK) {
            debug(`try spawn OK`);
            const name = role_name[0].toUpperCase() + makeid(3);
            ok = spawn.spawnCreep(
                parts,
                name,
                {
                    memory: { role: role_name, spawn_name: spawn.name, body: parts },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok === OK) {
                debug(`spawn OK`);
                b.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;
                b.reserved_energy = 0;
                console.log('Spawn ' + spawn.name + ' new ' + role_name + ' ' + name);
                return true;
            } else {
                debug(`spawn failed`);

            }
        } else {
            debug(`try spawn failed`);
            return true;
        }
    }
    return false;
}

function create_explorer(spawn) {
    let stop_creating = false;
    const role_name = 'explorer';
    const room = spawn.room;
    const rname = room.name;
    const base = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_explorer]: ${msg}`);
    }

    for (let rname in base.neighbor_rooms) {
        const nb = base.neighbor_rooms[rname];
        if (!(rname in Game.rooms) && !Game.creeps[nb.explorer_name]) {
            debug(`room ${rname} has no explorer`);

            if (!('create_creep_patience' in base))
                base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;

            let parts = [ATTACK, MOVE]
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
                base.create_creep_patience--;
                stop_creating = false; //never mind
            } else if (ok === OK) {
                debug(`OK`);
                base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;
                base.reserved_energy = 0;
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
    const base = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_claimer]: ${msg}`);
    }

    for (let rname in base.neighbor_rooms) {
        const nb = base.neighbor_rooms[rname];
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
                controller.reservation.ticksToEnd > 3000
            ) &&
            !Game.creeps[nb.claimer_name]) {
            debug(`room ${rname} has no claimer`);

            if (!('create_creep_patience' in base))
                base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;

            let parts = [CLAIM, CLAIM, MOVE, MOVE]
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
                base.create_creep_patience--;
                stop_creating = false; //never mind
            } else if (ok === OK) {
                debug(`OK`);
                base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;
                base.reserved_energy = 0;
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
    const base = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_attacker]: ${msg}`);
    }


    if (!('create_attacker_patience' in base))
        base.create_attacker_patience = 0;
    if (base.create_attacker_patience > 0) {
        debug(`waiting`);
        base.create_attacker_patience--;
        return stop_creating;
    }

    for (let rname in base.neighbor_rooms) {
        const room = Game.rooms[rname];
        if (!room) continue;
        const enemy = room.find(FIND_HOSTILE_CREEPS);
        if (!enemy.length) continue;
        {
            debug(`room ${rname} has no attacker`);

            let parts = [ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
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
                base.reserved_energy = energy_required;
            } else if (ok === OK) {
                debug(`OK`);
                base.create_attacker_patience = MAX_CREATE_ATTACKER_PATIENCE;
                base.reserved_energy = 0;
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
    const base = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_miner_and_transpoter]: ${msg}`);
    }
    const energyCapacityAvailable = room.energyCapacityAvailable;

    let res_count = 0;
    let miner_count = 0;
    for (let rid in base.res) {
        res_count++;
        const r = base.res[rid];
        if (Game.creeps[r.miner_name])
            miner_count++;
    }

    const transpoter_count = utils.get_or_zero(base.population, 'transpoter');
    let mine_transpoter_ratio = 1.5;
    if (transpoter_count < miner_count * mine_transpoter_ratio) {
        const parts = largest_possible_body(energyCapacityAvailable,
            [CARRY, CARRY, MOVE],
            [CARRY, CARRY, MOVE],
            transpoter_count >= 1 ? 3 : 0
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
            base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;
            base.reserved_energy = 0;
            debug(`Spawn ${spawn.name} new ${role_name} ${name}`);
            stop_creating = true;
        } else {
            debug(`spawn failed`);
        }
    } else if (miner_count < res_count) {
        const role_name = 'miner';
        for (let rid in base.res) {
            const r = base.res[rid];
            if (!Game.getObjectById(rid)) continue;
            if (!Game.creeps[r.miner_name]) {
                debug(`res ${rid} has no miner`);

                if (!('create_creep_patience' in base))
                    base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;

                const energyCapacityAvailable = room.energyCapacityAvailable;
                const parts = largest_possible_body(energyCapacityAvailable,
                    [WORK, WORK, CARRY, MOVE],
                    [WORK, WORK, MOVE],
                    base.create_creep_patience >= MAX_CREATE_CREEP_PATIENCE / 2 ? 2 :
                        base.create_creep_patience >= MAX_CREATE_CREEP_PATIENCE / 4 ? 1 : 0
                );
                const energy_required = energy_of_body(parts);
                debug(`parts = ${parts}`);
                r.miner_name = null;
                const name = role_name[0].toUpperCase() + makeid(3);
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
                    base.create_creep_patience--;
                    base.reserved_energy = energy_required;
                    stop_creating = true; //stop creating other creep
                } else if (ok === OK) {
                    debug(`OK`);
                    r.miner_name = name;
                    base.create_creep_patience = MAX_CREATE_CREEP_PATIENCE;
                    base.reserved_energy = 0;
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

        const base = Memory.bases[spawn.room.name];
        let n = base.recipe_stages
        for (let stage = 0; stage < n; stage++) {
            base.current_population_stage = stage;
            for (let role in base.recipe) {
                let numbers = base.recipe[role];
                if (create_creep(spawn, role, numbers[stage])) return;
            }
        }
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
    }
};
module.exports = Population;