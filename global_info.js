function initialize_sources() {
    //console.log('initialize sources')
    let old_res = Memory.res || {};
    Memory.res = {};
    for (let name in Game.spawns) {
        let sp = Game.spawns[name];
        var sources = Game.spawns[name].room.find(FIND_SOURCES);
        var sources_info = [];
        for (var s in sources) {
            var ss = sources[s];
            var path = PathFinder.search(sp.pos, { pos: ss.pos, range: 1 });
            var cost = path.cost;
            sources_info.push({ source: ss, cost });
        }
        for (let si of sources_info) {
            let id = si.source.id;
            Memory.res[id] = { pos: si.source.pos, history_time: old_res[id] && old_res[id].history_time || 0 };
        }
    }
}
function set_population_number() {
    //console.log('set_population_number')
    let energyCapacityAvailable = 0;
    for (let s in Game.spawns) {//TODO multiple base
        energyCapacityAvailable = Game.spawns[s].room.energyCapacityAvailable
    }

    var parts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];

    //var tanspoter_parts = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    if (energyCapacityAvailable <= 300 || (Memory.population.count['harvester'] <= 2 && Memory.population.count['transpoter'] <= 2)) {
        parts = [WORK, CARRY, MOVE];
    } else if (energyCapacityAvailable > 300 && energyCapacityAvailable <= 500) {
        parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    }
    //parts = [WORK,WORK,WORK,CARRY,MOVE,MOVE];
    // if (Memory.population == null) {
    //     parts = [WORK, CARRY, MOVE];
    //     tanspoter_parts = [CARRY, CARRY, MOVE];
    // } else if (Memory.population.count['transpoter'] <= 2) {
    //     parts = [WORK, CARRY, MOVE];
    //     tanspoter_parts = [CARRY, CARRY, MOVE];
    // }
    Memory.population = {};
    Memory.population.recipe_stages = 4;
    Memory.population.recipe = {};
    // number[k] means for stage k, I want this many creature of each type
    Memory.population.recipe['harvester'] =
        { number: [5, 6, 8, 8], body: parts };
    //Memory.population.recipe['transpoter'] =
    //    { number: [0, 0, 4, 6], body: tanspoter_parts };
    Memory.population.recipe['builder'] =
        { number: [0, 1, 1, 3], body: parts };
    Memory.population.recipe['upgrader'] =
        { number: [0, 1, 1, 5], body: parts };

    Memory.population.count = {};
    Memory.population.count['upgrader'] = 0;
    Memory.population.count['builder'] = 0;
    Memory.population.count['miner'] = 0;
    Memory.population.count['transpoter'] = 0;
    Memory.population.count['harvester'] = 0;
    for (let i in Game.creeps)
        Memory.population.count[Game.creeps[i].memory.role]++;
}
function decrease_history_time() {
    for (var i in Memory.res) {
        Memory.res[i].history_time *= 0.999;
    }
}
function statistics_per_tick() {
    if (!Memory.cpu_history_time) Memory.cpu_history_time = []
    let cpu = Game.cpu.getUsed();
    while (Memory.cpu_history_time.length >= 100) {
        Memory.cpu_history_time.shift();
    }
    Memory.cpu_history_time.push(cpu);
}

var globalInfo = {
    run: function () {
        set_population_number();
        initialize_sources();
    },
    per_tick: function () {
        decrease_history_time();
        statistics_per_tick();
    },
    print_statistic: function () {
        for (let history of [10, 50, 100]) {
            if (Memory.cpu_history_time.length >= history) {
                let sum = 0;
                for (let i = 0; i < history; i++)
                    sum += Memory.cpu_history_time[Memory.cpu_history_time.length - i - 1];
                sum /= history;
                console.log(`CPU time in ${history} last ticks: ${sum}`);
            }
        }
    }
};

module.exports = globalInfo;