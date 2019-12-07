var population = require('population');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleMiner = require('role.miner');
var roleHarvester = require('role.harvester');
var roleTranspoter = require('role.transpoter');
var roleFreeguy = require('role.freeguy');
var tools = require('tools');
var globalInfo = require('global_info');
var weapon_ctrl = require('weapon_ctrl');

module.exports.loop = function () {
    if (Game.time % 25 == 0) {
        globalInfo.run();
    }
    if (Game.time % 25 == 0) {
        population.run();
    }
    globalInfo.per_tick();

    for (let name in Game.creeps) {
        let c = Game.creeps[name];
        if (c.memory.role == 'harvester')
            roleHarvester.run(c);

        if (c.memory.role == 'upgrader')
            roleUpgrader.run(c);

        if (c.memory.role == 'builder')
            roleBuilder.run(c);

        if (c.memory.role == 'miner')
            roleMiner.run(c);

        if (c.memory.role == 'transpoter')
            roleTranspoter.run(c);

        if (c.memory.role == 'freeguy')
            roleFreeguy.run(c);
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