function init_bases() {
    const seen_rooms = new Set();
    if (!Memory.bases) Memory.bases = {};
    const bs = Memory.bases;
    for (let rname in bs)
        bs[rname].spawns = [];

    for (const [name, sp] of Object.entries(Game.spawns)) {
        const rname = sp.room.name
        seen_rooms.add(rname);
        if (!bs[rname]) bs[rname] = {};
        const b = bs[rname];
        if (!b.spawns) b.spawns = [];
        b.spawns.push(name);
    }

    const extra_neighbors = {
        'W9S3': ['W8S4', 'W7S4'],
        'W9S6': ['W8S5', 'W7S5', 'W7S6', 'W8S6']
    };

    for (const [bname, b] of Object.entries(bs)) {
        if (!b.neighbor_rooms) b.neighbor_rooms = {};
        const nbs = b.neighbor_rooms;
        const exits = Game.map.describeExits(bname);
        let nb_names = Object.keys(exits).map(x => exits[x]);
        if (extra_neighbors[bname]) {
            nb_names = nb_names.concat(extra_neighbors[bname]);
        }
        for (const nb_name of nb_names) {
            if (seen_rooms.has(nb_name)) continue;
            seen_rooms.add(nb_name);

            if (!nbs[nb_name]) nbs[nb_name] = {};
            const nb = nbs[nb_name];
            if (!nb.status) nb.status = "unknown";
            if (!('explorer_name' in nb)) nb.explorer_name = '';
            if (nb_name in Game.rooms && nb.status != 'danger') {
                nb.status = 'visible';
            }
        }
    }

    for (const [bname, b] of Object.entries(bs)) {
        if (!b.res) b.res = {};
        const res = b.res;
        const broom = Game.rooms[bname];
        const sp = Game.spawns[b.spawns[0]];

        const rooms_search = [bname].concat(Object.keys(b.neighbor_rooms));
        for (const rname of rooms_search) {
            let pos_start = null;
            const room = Game.rooms[rname];
            if (!room) continue;
            if (room.controller && room.controller.owner && !room.controller.my) continue;
            if (rname == bname) {
                pos_start = sp.pos;
            } else {
                pos_start = room.find(room.findExitTo(broom))[0];
            }
            const sources = room.find(FIND_SOURCES);
            for (const s of sources) {
                const id = s.id;
                if (!res[id]) {
                    const r = res[id] = {};
                    const path = PathFinder.search(pos_start, { pos: s.pos, range: 1 }).path;
                    r.pos = s.pos;
                    r.mining_pos = path[path.length - 1];
                }
            }
        }
    }
}

function set_population_number() {
    const bs = Memory.bases;
    for (const rname in Memory.bases) {
        bs[rname].population = {};
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