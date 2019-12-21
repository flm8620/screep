var dd = require('destinations');
var utils = require('utils');

function manhattan_distance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

const MAX_PATIENCE_CONVERT_ROLE = 80;

function ready_to_convert_role(creep, worth) {
    if (!('patience_convert_role' in creep.memory)) creep.memory.patience_convert_role = MAX_PATIENCE_CONVERT_ROLE + Math.random() * 20;
    if (worth)
        creep.memory.patience_convert_role--;
    else
        creep.memory.patience_convert_role = MAX_PATIENCE_CONVERT_ROLE;
    return creep.memory.patience_convert_role <= 0;
}

var tools = {
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
    update_history_time_for_resource: function (creep, add_to) {
        if (creep.memory.resource_id) {
            if (!add_to)
                console.log(creep.memory.resource_id + ' resource timer average with ' + creep.memory.mining_timer)
            else
                console.log(creep.memory.resource_id + ' resource timer add by ' + (0.2 * creep.memory.mining_timer))
            if (!add_to)
                Memory.res[creep.memory.resource_id].history_time *= 0.8;
            Memory.res[creep.memory.resource_id].history_time += 0.2 * creep.memory.mining_timer;
        }
        creep.memory.resource_id = '';
        creep.memory.mining_timer = 0;
    },
    worth_to_convert_to_transpoter: function (creep) {
        const room = Game.spawns[creep.memory.spawn_name].room;
        const stage = room.memory.current_population_stage;
        let worth = utils.get_or_zero(room.memory.population, 'transpoter') < room.memory.recipe['transpoter'][stage];
        return ready_to_convert_role(creep, worth);
    },
    worth_to_convert_to_miner: function (creep) {
        const room_name = Game.spawns[creep.memory.spawn_name].room.name;
        for (let rid in Memory.res) {
            if (Memory.res[rid].pos.roomName !== room_name) continue;
            if (!Memory.res[rid].miner_id) {
                return ready_to_convert_role(creep, true);
            }
        }
        return ready_to_convert_role(creep, false);
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
    goto_and_get_energy: function (creep) {
        let something = dd.get_dest_obj(creep);
        if (!something) return false;
        if (!creep.pos.isNearTo(something.pos)) {
            dd.move_to_destination(creep);
            return true;
        } else {
            let ok = creep.withdraw(something, RESOURCE_ENERGY);
            if (ok == ERR_NOT_IN_RANGE) {
                dd.clear_destination(creep);
                return false;
            } else if (ok == ERR_NOT_ENOUGH_RESOURCES) {
                return false;
            } else if (ok == ERR_INVALID_TARGET) {
                ok = creep.pickup(something);
                return ok == OK;
            }

            if (ok == OK) {
                dd.clear_destination(creep);
                return true;
            }
            else
                return false
        }

    },
    get_energy_or_become_transpoter: function (creep) {
        dd.clear_destination(creep);
        if (tools.worth_to_convert_to_transpoter(creep)) {
            console.log(creep.name + ' become transpoter');
            creep.memory.role = 'transpoter';
            return;
        } else if (tools.worth_to_convert_to_miner(creep)) {
            console.log(creep.name + ' become miner');
            creep.memory.role = 'miner';
            return;
        }
        if (!dd.set_id_as_destination(creep, dd.pick_available_energy_store_id(creep))) {
            // random move
            tools.random_move(creep);
        }
    },
    pick_nearest_target_number: function (targets, pos) {//return -1 if empty
        var min_d = 9999999;
        var nearest = -1;
        for (var t in targets) {
            let d = manhattan_distance(targets[t].pos, pos);
            if (d < min_d) {
                nearest = t;
                min_d = d;
            }
        }
        return nearest;
    },
    count_move_parts: function (creep) {
        if (creep.memory.work_count == null) {
            var c = 0;
            for (var i in creep.body) {
                if (creep.body[i].type == WORK) {
                    c++;
                }
            }
            creep.memory.work_count = c;
        }
        return creep.memory.work_count;
    }
}
module.exports = tools;