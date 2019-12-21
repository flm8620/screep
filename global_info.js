var tools = require('tools');
function initialize_sources() {
    if (!Memory.res)
        Memory.res = {};
    let sources_info = [];
    for (let name in Game.spawns) {
        let sp = Game.spawns[name];
        var sources = Game.spawns[name].room.find(FIND_SOURCES);

        for (var s in sources) {
            let ss = sources[s];
            let id = ss.id;
            if (!Memory.res[id]) Memory.res[id] = {};
            let mining_pos = Memory.res[id].mining_pos;
            if (!mining_pos) {
                let path = PathFinder.search(sp.pos, { pos: ss.pos, range: 1 }).path;
                mining_pos = path[path.length - 1];
            }
            sources_info.push({ source: ss, mining_pos })
        }
    }
    for (let si of sources_info) {
        let id = si.source.id;
        if (!Memory.res[id]) Memory.res[id] = {};
        Memory.res[id].pos = si.source.pos;
        if (!Memory.res[id].history_time)
            Memory.res[id].history_time = 0;
        Memory.res[id].mining_pos = si.mining_pos;
    }
}
function set_population_number() {
    delete Memory.rooms;

    for (let s in Game.spawns) {
        let room = Game.rooms[Game.spawns[s].room.name];
        room.memory.recipe = {};
        room.memory.population = {}
        let r = room.memory.population;
        r['upgrader'] = 0;
        r['builder'] = 0;
        r['miner'] = 0;
        r['transpoter'] = 0;
        r['harvester'] = 0;
        r['freeguy'] = 0;
    }

    for (const name in Memory.rooms) {
        const room = Game.rooms[name];
        const source_count = room.find(FIND_SOURCES).length;
        room.memory.recipe = {};
        room.memory.recipe_stages = 4;
        let r = room.memory.recipe;
        r['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        r['builder'] = [0, 1, 2, 3];
        r['upgrader'] = [0, 1, 2, 5];
        r['freeguy'] = [0, 0, 0, 0];
        let re = room.memory.recipe_in_energy = {};
        re['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        re['builder'] = [0, 1, 2, 3];
        re['upgrader'] = [0, 1, 2, 5];
        re['freeguy'] = [0, 0, 0, 0];
    }

    for (let i in Game.creeps) {
        const c = Game.creeps[i];
        const s_name = c.memory.spawn_name;
        if (!s_name) continue;
        const room = Game.spawns[s_name].room;
        room.memory.population[Game.creeps[i].memory.role]++;
    }

    for (let i in Game.creeps) {
        const c = Game.creeps[i];
        const s_name = c.memory.spawn_name;
        if (!s_name) continue;
        const room = Game.spawns[s_name].room;
        const mem = room.memory;
        if (!('population_in_energy' in mem)) {
            mem.population_in_energy = {};
        }
        const p = mem.population_in_energy;
        const role = Game.creeps[i].memory.role;
        if (!(role in p)) {
            p[role] = 0;
        }
        p[role] += tools.energy_of_body(c.body.map(b => b.type));
    }
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