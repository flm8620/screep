var dd = require('destinations');
var utils = require('utils');

function manhattan_distance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

var tools = {
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
        if (!Memory.current_population_stage) return false;
        let stage = Memory.current_population_stage[creep.memory.spawn_name];
        return Math.random() < 0.02 && Memory.population.count['transpoter'] < Memory.population.recipe['transpoter'].number[stage];
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
        }
        if (!dd.set_id_as_destination(creep, dd.pick_available_resource_store_id(creep))) {
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