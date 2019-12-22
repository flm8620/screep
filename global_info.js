var tools = require('tools');
function init_bases() {
    if (!Memory.bases)
        Memory.bases = {};
    const bs = Memory.bases;
    for (let rname in bs) {
        bs[rname].spawns = [];
    }
    for (const [name, sp] of Object.entries(Game.spawns)) {
        const rname = sp.room.name
        if (!bs[rname]) bs[rname] = {};
        const b = bs[rname];
        if (!b.spawns) b.spawns = [];
        b.spawns.push(name);
    }

    for (const [bname, b] of Object.entries(bs)) {
        if (!b.res) b.res = {};
        const res = b.res;
        const room = Game.rooms[bname];
        const sp = Game.spawns[b.spawns[0]];
        const sources = room.find(FIND_SOURCES);
        for (const s of sources) {
            const id = s.id;
            if (!res[id]) {
                const r = res[id] = {};
                const path = PathFinder.search(sp.pos, { pos: s.pos, range: 1 }).path;
                r.pos = s.pos;
                r.mining_pos = path[path.length - 1];
            }
        }
    }
}
function set_population_number() {
    const bs = Memory.bases;
    for (const rname in Memory.bases) {
        bs[rname].recipe = {};
        bs[rname].recipe_in_energy = {};
        bs[rname].population = {};
        bs[rname].population_in_energy = {};
    }

    for (const rname in bs) {
        const b = bs[rname];
        const room = Game.rooms[rname];
        const source_count = room.find(FIND_SOURCES).length;
        b.recipe_stages = 4;
        let r = b.recipe;
        r['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        r['builder'] = [0, 2, 4, 8];
        r['freeguy'] = [0, 0, 0, 0];
        let re = b.recipe_in_energy = {};
        b.recipe_in_energy_stages = 4;
        re['transpoter'] = [1 * source_count, 2 * source_count, 2 * source_count, 2 * source_count];
        re['builder'] = [0, 1, 2, 3];
        re['freeguy'] = [0, 0, 0, 0];
    }

    for (let i in Game.creeps) {
        const c = Game.creeps[i];
        const s_name = c.memory.spawn_name;
        if (!s_name) continue;
        const rname = Game.spawns[s_name].room.name;
        const b = bs[rname];
        const pop = b.population;
        const role = Game.creeps[i].memory.role;
        if (!(role in pop)) pop[role] = 0;
        pop[role]++;
        const pop_e = b.population_in_energy;
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
        init_bases();
        set_population_number();
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