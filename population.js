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
    body.reduce((accum, v) => {
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
function largest_possible_body(energy_available) {
    body = [WORK, CARRY, MOVE];
    while (energy_of_body(body.concat([WORK, CARRY, MOVE])) < energy_available) {
        body = body.concat([WORK, CARRY, MOVE]);
    }
    return body;
}
function largest_possible_transpoter_body(energy_available) {
    body = [CARRY, CARRY, MOVE];
    let i = 0;
    while (energy_of_body(body.concat([CARRY, CARRY, MOVE])) < energy_available && i < 4 && Memory.population.count['transpoter'] > 1) {
        body = body.concat([CARRY, CARRY, MOVE]);
        i++;
    }
    return body;
}
function largest_possible_miner_body(energy_available) {
    body = [WORK, CARRY, MOVE];
    let i = 0;
    while (energy_of_body(body.concat([WORK, WORK, MOVE])) < energy_available && i < 4 && Memory.population.count['transpoter'] > 2) {
        body = body.concat([WORK, WORK, MOVE]);
        i++;
    }
    return body;
}
// return true to stop create others
function create_creep(spawn, role_name, number) {
    let energyCapacityAvailable = spawn.room.energyCapacityAvailable;
    let parts = largest_possible_body(energyCapacityAvailable);
    if (role_name === 'transpoter') {
        if (Memory.population.count['miner'] == 0) {
            return true;
        }
        parts = largest_possible_transpoter_body(energyCapacityAvailable);
    } else if (role_name === 'freeguy') {
        parts = [WORK, CARRY, MOVE, ATTACK];
    }
    var creatures = _.filter(Game.creeps, (creep) => creep.memory.role == role_name);
    if (creatures.length < number) {
        var ok = spawn.spawnCreep(parts, 'asdasdasdasdasd', { dryRun: true });
        if (ok === OK) {
            let name = role_name[0].toUpperCase() + makeid(2);
            ok = spawn.spawnCreep(parts, name, { memory: { role: role_name, spawn_name: spawn.name, body: parts } });
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
        var r = Memory.res[i];
        if (!Game.getObjectById(r.miner_id)) {
            let room = r.pos.roomName;
            let spawn = null;
            for (let sname in Memory.spawns) {
                if (!spawn) spawn = Game.spawns[sname];
                if (Game.spawns[sname].room.name === room) {
                    spawn = Game.spawns[sname];
                    break;
                }
            }
            let energyCapacityAvailable = spawn.room.energyCapacityAvailable;
            let parts = largest_possible_miner_body(energyCapacityAvailable);
            r.miner_id = null;
            var ok = spawn.spawnCreep(parts, role_name[0].toUpperCase() + makeid(2), { memory: { role: role_name } });
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
    reproduce: function () {
        Memory.current_population_stage = {}
        for (let s in Game.spawns) {
            var n = Memory.population.recipe_stages
            for (var stage = 0; stage < n; stage++) {
                Memory.current_population_stage[s] = stage;
                for (var role in Memory.population.recipe) {
                    var recipe = Memory.population.recipe[role];
                    if (create_creep(Game.spawns[s], role, recipe.number[stage])) return;
                }
            }
        }
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