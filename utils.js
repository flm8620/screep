var utils = {
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
            creep.move(TOP);
        else if (y == 49)
            creep.move(LEFT);
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
    }
}
module.exports = utils;