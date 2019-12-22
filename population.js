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
    if (role_name === 'transpoter') {
        if (utils.get_or_zero(room_pop, 'miner') == 0)
            return true;

        parts = largest_possible_body(energyCapacityAvailable,
            [CARRY, CARRY, MOVE],
            [CARRY, CARRY, MOVE],
            utils.get_or_zero(room_pop, 'transpoter') >= 1 ? 3 : 0
        );
    } else if (role_name === 'freeguy') {
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
            let name = role_name[0].toUpperCase() + makeid(2);
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
const MAX_CREATE_MINER_PATIENCE = 10;
function create_miner(spawn) {
    
    let stop_creating = false;
    const role_name = 'miner';
    const room = spawn.room;
    const rname = room.name;
    const base = Memory.bases[rname];

    const DEBUG_ON = false;
    let debug = function (msg) {
        if (DEBUG_ON)
            console.log(`[${spawn.name}.create_miner]: ${msg}`);
    }

    for (let rid in base.res) {
        const r = base.res[rid];
        if (!Game.getObjectById(r.miner_id)) {
            debug(`res ${rid} has no miner`);

            if (!('create_miner_patience' in base))
                base.create_miner_patience = MAX_CREATE_MINER_PATIENCE;

            let energyCapacityAvailable = room.energyCapacityAvailable;
            let parts = largest_possible_body(energyCapacityAvailable,
                [WORK, CARRY, MOVE],
                [WORK, WORK, MOVE],
                utils.get_or_zero(room.memory.population, 'transpoter') >= 2 && room.memory.create_miner_patience > 0 ? 2 : 0
            );
            debug(`parts = ${parts}`);
            r.miner_id = null;
            var ok = spawn.spawnCreep(
                parts,
                role_name[0].toUpperCase() + makeid(2),
                {
                    memory: { role: role_name, spawn_name: spawn.name, body: parts },
                    directions: ALL_DIRECTIONS
                }
            );
            if (ok == ERR_NOT_ENOUGH_ENERGY) {
                debug(`ERR_NOT_ENOUGH_ENERGY, room ${room.name} patience--`);
                room.memory.create_miner_patience--;
                stop_creating = true; //stop creating other creep
            } else if (ok === OK) {
                debug(`OK`);
                room.memory.create_miner_patience = MAX_CREATE_MINER_PATIENCE;
                stop_creating = true;
                break;
            }
        }
    }
    return stop_creating;
}

var Population = {
    reproduce_spawn: function (spawn) {
        if (create_miner(spawn)) return;
        const room = spawn.room;
        let n = room.memory.recipe_stages
        for (let stage = 0; stage < n; stage++) {
            room.memory.current_population_stage = stage;
            for (let role in room.memory.recipe) {
                let numbers = room.memory.recipe[role];
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