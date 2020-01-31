let cpu_time = [];
var utils = {
    tic: function () {
        cpu_time.push(Game.cpu.getUsed());
    },
    toc: function (name) {
        const t = Game.cpu.getUsed() - cpu_time.pop();
        console.log(`${name}: ${t}`);
    },
    find_closest_by_path: function (p1, list) {
        let lastPos = p1;
        const r = PathFinder.search(p1, list.map((x) => ({ pos: x.pos, range: 1 })));
        const path = r.path;
        if (path.length)
            lastPos = path[path.length - 1];
        let result = null;
        for (const e of list)
            if (lastPos.isNearTo(e))
                result = e;
        if (!result) {
            console.log(`path: ${r.path.length} ${r.ops} ${list.length}`);
            for (let l of list) {
                console.log(`list: ${l.pos}`);
            }
        }
        return { path: path, target: result };
    },
    distance_between_pos: function (pa, pb) {
        let p1 = new RoomPosition(pa.x, pa.y, pa.roomName);
        let p2 = new RoomPosition(pb.x, pb.y, pb.roomName);
        const path = PathFinder.search(p1, { pos: p2, range: 1 }).path;
        return path.length;
    },
    random_idx_with_probability: function (probs) {
        let sum = 0;
        for (var i = 0; i < probs.length; i++) sum += probs[i];
        let s = 0;
        let r = Math.random() * sum;
        for (var i = 0; i < probs.length; i++) {
            s += probs[i];
            if (r <= s)
                return i;
        }
    },
    is_at_border: function (creep) {
        const x = creep.pos.x;
        const y = creep.pos.y;
        return x == 0 || y == 0 || x == 49 || y == 49;
    },
    move_out_of_border: function (creep) {
        const x = creep.pos.x;
        const y = creep.pos.y;
        if (x == 0)
            creep.move(RIGHT);
        else if (y == 0)
            creep.move(BOTTOM);
        else if (x == 49)
            creep.move(LEFT);
        else if (y == 49)
            creep.move(TOP);
    },
    move_to_border: function (creep) {
        const x = creep.pos.x;
        const y = creep.pos.y;
        if (x == 1)
            creep.move(LEFT);
        else if (y == 1)
            creep.move(TOP);
        else if (x == 48)
            creep.move(RIGHT);
        else if (y == 48)
            creep.move(BOTTOM);
    },
    get_or_zero: function (obj, field) {
        if (field in obj)
            return obj[field];
        return 0;
    },
    attack_enemy: function (creep) {
        let enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,
            { filter: (structure) => structure.structureType == STRUCTURE_TOWER });
        if (!enemy)
            enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!enemy)
            enemy = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES,
                { filter: (s) => s.structureType != STRUCTURE_CONTROLLER && s.structureType != STRUCTURE_POWER_BANK });

        if (enemy) {
            let p = enemy.pos;
            if (!creep.pos.isNearTo(p)) {
                creep.moveTo(p);
            } else {
                creep.attack(enemy);
            }
            if (creep.pos.inRangeTo(p)) {
                creep.rangedAttack(enemy);
            }
            return true;
        }
        return false;
    },
    energy_of_body: function (body) {
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
    },
    random_move: function (creep) {
        let idx = utils.random_idx_with_probability([1, 1, 1, 1, 1, 1, 1, 1]);
        let moves = [TOP,
            TOP_RIGHT,
            RIGHT,
            BOTTOM_RIGHT,
            BOTTOM,
            BOTTOM_LEFT,
            LEFT,
            TOP_LEFT];
        creep.move(moves[idx]);
    },
    random_move_in_room: function (creep) {
        if (utils.is_at_border(creep)) {
            utils.move_out_of_border(creep);
            return;
        }
        const x = creep.pos.x;
        const y = creep.pos.y;
        let prob = [1, 1, 1, 1, 1, 1, 1, 1];
        if (x == 1) {
            prob[5] = prob[6] = prob[7] = 0;
        }
        if (y == 1) {
            prob[7] = prob[0] = prob[1] = 0;
        }
        if (x == 48) {
            prob[1] = prob[2] = prob[3] = 0;
        }
        if (y == 48) {
            prob[3] = prob[4] = prob[5] = 0;
        }
        let idx = utils.random_idx_with_probability(prob);
        let moves = [TOP,
            TOP_RIGHT,
            RIGHT,
            BOTTOM_RIGHT,
            BOTTOM,
            BOTTOM_LEFT,
            LEFT,
            TOP_LEFT];
        creep.move(moves[idx]);
    }
}
module.exports = utils;