function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
// return true to stop create others
function create_creep(spawn, role_name, number, parts) {
    // if (role_name == 'transpoter') {
    //     if (Memory.population.count['miner'] == 0) {
    //         return true;
    //     }
    // }
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
    var parts = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
    if (Memory.population.count['transpoter'] < 2 || Memory.population.count['miner'] == 0) {
        parts = [WORK, CARRY, MOVE];
    }
    var stop_creating = false;
    return stop_creating;
    for (var i in Memory.res) {
        var r = Memory.res[i];
        if (!Game.getObjectById(r.miner_id)) {
            r.miner_id = null;
            var newName = Game.spawns['Origin'].spawnCreep(parts, undefined, { memory: { role: 'miner', mine_index: i } });
            if (newName == ERR_NOT_ENOUGH_ENERGY) {
                stop_creating = true; //stop creating other creep
            } else if (typeof newName === 'string') {
                console.log('Spawning new ' + 'miner' + ' ' + newName);
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
                    if (create_creep(Game.spawns[s], role, recipe.number[stage], recipe.body)) return;
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