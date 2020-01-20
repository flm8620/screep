var utils = {
    distance_between_pos: function (pa, pb) {
        let p1 = new RoomPosition(pa.x, pa.y, pa.roomName);
        let p2 = new RoomPosition(pb.x, pb.y, pb.roomName);
        const path = PathFinder.search(p1, p2).path;
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
    get_or_zero: function (obj, field) {
        if (field in obj)
            return obj[field];
        return 0;
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