var dd = require('destinations');
var utils = require('utils');

function manhattan_distance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

var tools = {
    worth_to_convert_to_harvester: function (creep) {
        if (!Memory.current_population_stage) return false;
        let stage = Memory.current_population_stage[creep.memory.spawn_name];
        return Memory.population.count['harvester'] < Memory.population.recipe['harvester'].number[stage];
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
        var store = dd.get_dest_obj(creep);
        var ok = creep.withdraw(store, RESOURCE_ENERGY);
        if (ok == ERR_NOT_IN_RANGE) {
            dd.move_to_destination(creep);
            return true;
        } else if (ok == ERR_NOT_ENOUGH_RESOURCES) {
            return false;
        } else if (ok == ERR_INVALID_TARGET) {
            return false;
        }

        if (ok == OK)
            return true;
        else
            return false
    },
    get_energy_or_become_harvester: function (creep) {
        dd.clear_destination(creep);
        if (tools.worth_to_convert_to_harvester(creep)) {
            console.log(creep.name + ' become harvester');
            creep.memory.role = 'harvester';
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