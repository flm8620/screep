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
        Memory.res[id].mining_pos = si.mining_pos;
    }
}
function set_population_number() {
    for (let rname in Memory.rooms) {
        delete Memory.rooms[rname].recipe;
        delete Memory.rooms[rname].recipe_in_energy;
        delete Memory.rooms[rname].population;
        delete Memory.rooms[rname].population_in_energy;
    }

    for (let s in Game.spawns) {
        let room = Game.rooms[Game.spawns[s].room.name];
        room.memory.recipe = {};
        room.memory.population = {}
        room.memory.recipe_in_energy = {}
        room.memory.population_in_energy = {}
    }

    for (const name in Memory.rooms) {
        const room = Game.rooms[name];
        const source_count = room.find(FIND_SOURCES).length;
        room.memory.recipe_stages = 4;
        let r = room.memory.recipe;
        r['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        r['builder'] = [0, 2, 4, 8];
        r['freeguy'] = [0, 0, 0, 0];
        let re = room.memory.recipe_in_energy = {};
        room.memory.recipe_in_energy_stages = 4;
        re['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        re['builder'] = [0, 1, 2, 3];
        re['freeguy'] = [0, 0, 0, 0];
    }

    for (let i in Game.creeps) {
        const c = Game.creeps[i];
        const s_name = c.memory.spawn_name;
        if (!s_name) continue;
        const room = Game.spawns[s_name].room;
        const pop = room.memory.population;
        const role = Game.creeps[i].memory.role;
        if (!(role in pop)) pop[role] = 0;
        pop[role]++;
        const pop_e = room.memory.population_in_energy;
        if (!(role in pop_e)) pop_e[role] = 0;
        pop_e[role] += tools.energy_of_body(c.body.map(b => b.type));
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