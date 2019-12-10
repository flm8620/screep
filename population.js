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
    const room = spawn.room;
    const room_pop = room.memory.population;
    let energyCapacityAvailable = spawn.room.energyCapacityAvailable;
    let parts = largest_possible_body(energyCapacityAvailable,
        [WORK, CARRY, MOVE],
        [WORK, CARRY, MOVE],
        100
    );
    if (role_name === 'transpoter') {
        if (room_pop['miner'] == 0)
            return true;

        parts = largest_possible_body(energyCapacityAvailable,
            [CARRY, CARRY, MOVE],
            [CARRY, CARRY, MOVE],
            room_pop['transpoter'] > 1 ? 4 : 0
        );
    } else if (role_name === 'freeguy') {
        // parts = [WORK, WORK, WORK, WORK, WORK,
        //     CARRY, CARRY, CARRY, CARRY, CARRY,
        //     MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (role_name === 'builder') {
        parts = largest_possible_body(energyCapacityAvailable,
            [WORK, CARRY, MOVE],
            [WORK, CARRY, MOVE],
            8
        );
    }

    let current_number = room_pop[role_name];
    if (current_number < number) {
        var ok = spawn.spawnCreep(parts, 'asdasdasdasdasd', { dryRun: true });
        if (ok === OK) {
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
                console.log('Spawn ' + spawn.name + ' new ' + role_name + ' ' + name);
                return true;
            }
        } else {
            return true;
        }
    }
    return false;
}

function create_miner() {
    var stop_creating = false;
    let role_name = 'miner';
    for (var i in Memory.res) {
        const r = Memory.res[i];
        const source = Game.getObjectById(i);
        if (!Game.getObjectById(r.miner_id)) {
            const room = source.room;
            let spawn = null;
            for (let sname in Game.spawns) {
                if (!spawn) spawn = Game.spawns[sname];
                if (Game.spawns[sname].room === room) {
                    spawn = Game.spawns[sname];
                    break;
                }
            }
            let energyCapacityAvailable = room.energyCapacityAvailable;
            let parts = largest_possible_body(energyCapacityAvailable,
                [WORK, CARRY, MOVE],
                [WORK, WORK, MOVE],
                room.memory.population['transpoter'] >= 2 ? 2 : 0
            );
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
                stop_creating = true; //stop creating other creep
            } else if (ok === OK) {
                stop_creating = true;
                break;
            }
        }
    }
    return stop_creating;
}

var Population = {
    reproduce_spawn: function (spawn) {
        const room = spawn.room;
        let n = Memory.population.recipe_stages
        for (let stage = 0; stage < n; stage++) {
            room.memory.current_population_stage = stage;
            for (let role in Memory.population.recipe) {
                let recipe = Memory.population.recipe[role];
                if (create_creep(spawn, role, recipe.number[stage])) return;
            }
        }
    },
    reproduce: function () {
        for (let s in Game.spawns)
            Population.reproduce_spawn(Game.spawns[s]);
    },
    run: function () {
        //console.log('Population module run');
        if (!create_miner()) {
            Population.reproduce();
        }

        if (!('harvester_contrib_history' in Memory)) {
            Memory.harvester_contrib_history = [];
        }
        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {
                let creep_mem = Memory.creeps[name];
                if (creep_mem.role === 'harvester') {
                    if (creep_mem.resource_id) {
                        console.log(creep_mem.resource_id + ' due to creep death, resource timer += 0.2 x ' + creep_mem.mining_timer)
                        Memory.res[creep_mem.resource_id].history_time += creep_mem.mining_timer * 0.2/*death punishment*/;
                    }
                    if ('contrib' in creep_mem) {
                        Memory.harvester_contrib_history.push({ contrib: creep_mem.contrib, body: creep_mem.body });
                    }
                }
                delete Memory.creeps[name];
            }
        }
        while (Memory.harvester_contrib_history.length > 100) {
            Memory.harvester_contrib_history.shift();
        }
    }
};
module.exports = Population;