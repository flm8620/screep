const profiler = require('screeps-profiler');
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

function clean_reservation(reserve) {
    for (let id in reserve) {
        if (_.isEmpty(reserve[id]))
            delete reserve[id];
        else if (!Game.getObjectById(id))
            delete reserve[id];
        else {
            const res = reserve[id];
            for (const creep_name in res) {
                if (!Game.creeps[creep_name])
                    delete res[creep_name];
            }
        }
    }
}
//profiler.enable();
const BUCKET_HIGH = 500;
const BUCKET_LOW = 100;
let use_bucket_high = false;
module.exports.loop = function () {
    profiler.wrap(function () {
        const bucket = Game.cpu.bucket
        if (!use_bucket_high && bucket < BUCKET_LOW) {
            use_bucket_high = true;
            console.log(`skip round: cpu bucket = ${Game.cpu.bucket}`);
            return;
        } else if (use_bucket_high && bucket < BUCKET_HIGH) {
            console.log(`skip round: recharge bucket: cpu bucket = ${Game.cpu.bucket}`);
            return;
        } else {
            use_bucket_high = false;
        }

        if (Game.time % 10 == 0) {
            console.log('run global update');
            globalInfo.run();
            population.run();
        }

        if (!Memory.transpoter_reservation)
            Memory.transpoter_reservation = {};
        clean_reservation(Memory.transpoter_reservation);

        if (!Memory.builder_reservation)
            Memory.builder_reservation = {};
        clean_reservation(Memory.builder_reservation);

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

        const MAX_SLEEP_TIME = 20;
        const MAX_SLEEP_COUNTDOWN = 50;
        if (!('tower_sleep_countdown' in Memory)) Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
        if (!('tower_sleeped' in Memory)) Memory.tower_sleeped = 0;
        if (Memory.tower_sleep_countdown == 0) {
            Memory.tower_sleeped++;
            if (Memory.tower_sleeped > MAX_SLEEP_TIME) {
                Memory.tower_sleeped = 0;
                Memory.tower_sleep_countdown = 1;
            }
        } else {
            Memory.tower_sleep_countdown--;
            let need_continue = false;
            for (let s in Game.spawns) {
                let sp = Game.spawns[s];
                let towers = sp.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_TOWER });
                for (let tower of towers) {
                    if (weapon_ctrl.run(tower))
                        need_continue = true;
                }
            }
            if (need_continue) {
                Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
            }
        }

        globalInfo.per_tick();
        if (Game.time % 25 == 0) {
            globalInfo.print_statistic();
        }

        console.log(`cpu: ${Game.cpu.getUsed()}`);
        console.log(`cpu.bucket: ${Game.cpu.bucket}`);
    })
}