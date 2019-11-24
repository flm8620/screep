var population = require('population');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleMiner = require('role.miner');
var roleHarvester = require('role.harvester');
var roleTranspoter = require('role.transpoter');
var tools = require('tools');
var globalInfo = require('global_info');
var weapon_ctrl = require('weapon_ctrl');

module.exports.loop = function () {
    if (Game.time % 10 == 0) {
        globalInfo.run();
    }
    if (Game.time % 10 == 0) {
        population.run();
    }
    globalInfo.per_tick();

    weapon_ctrl.run();
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
    }

    if (Game.time % 50 == 0) {
        globalInfo.print_statistic();
    }
}