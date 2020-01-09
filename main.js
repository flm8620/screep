var population = require('population');
var roleBuilder = require('role.builder');
var roleMiner = require('role.miner');
var roleTranspoter = require('role.transpoter');
var roleRecycle = require('role.recycle');
var roleExplorer = require('role.explorer');
var roleClaimer = require('role.claimer');
var roleAttacker = require('role.attacker');
var roleFreeguy = require('role.freeguy');
var globalInfo = require('global_info');
var weapon_ctrl = require('weapon_ctrl');

module.exports.loop = function () {
    if (Game.time % 5 == 0) {
        globalInfo.run();
    }
    if (Game.time % 5 == 0) {
        population.run();
    }
    globalInfo.per_tick();

    if (!Memory.transpoter_reservation) Memory.transpoter_reservation = {};
    for (let id in Memory.transpoter_reservation) {
        if (_.isEmpty(Memory.transpoter_reservation[id]))
            delete Memory.transpoter_reservation[id];
        else if (!Game.getObjectById(id))
            delete Memory.transpoter_reservation[id];
        else {
            const res = Memory.transpoter_reservation[id];
            for (const creep_name in res) {
                if (!Game.creeps[creep_name])
                    delete res[creep_name];
            }
        }
    }

    for (let name in Game.creeps) {
        let c = Game.creeps[name];

        if (c.memory.role == 'builder')
            roleBuilder.run(c);

        if (c.memory.role == 'miner')
            roleMiner.run(c);

        if (c.memory.role == 'transpoter')
            roleTranspoter.run(c);

        if (c.memory.role == 'explorer')
            roleExplorer.run(c);

        if (c.memory.role == 'attacker')
            roleAttacker.run(c);

        if (c.memory.role == 'claimer')
            roleClaimer.run(c);

        if (c.memory.role == 'freeguy')
            roleFreeguy.run(c);

        if (c.memory.role == 'recycle')
            roleRecycle.run(c);
    }

    for (let s in Game.spawns) {
        let sp = Game.spawns[s];
        let towers = sp.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_TOWER });
        for (let tower of towers) {
            weapon_ctrl.run(tower);
        }
    }

    if (Game.time % 50 == 0) {
        globalInfo.print_statistic();
    }
}