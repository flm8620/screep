var tools = require('tools');
var dd = require('destinations');


function change_mode_mining(creep){
    dd.clear_destination(creep);
    creep.say('start');
    var i = creep.memory.mine_index;
    var r = Game.getObjectById(Memory.res[i].id);
    console.log('source '+i+'is mining by '+creep.name);
    Memory.res[i].miner_id = creep.id;
    var mining_pos = Memory.res[i].mining_pos;
    
    console.log('set res '+i+' to creep '+creep.id);
    return dd.set_pos_as_destination(creep, mining_pos);
}

const PATIENCE_MAX = 20;
var roleMiner = {
    run: function(creep) {
        if(creep.spawning) return;
        if(!dd.has_destination(creep)){
            change_mode_mining(creep);
            return;
        }
        
        if(!dd.is_at_destination(creep)){
            var ran = _.random(0,1);
            var ignoreCreeps = false;
            var color = '#ffffff';
            
            if(ran == 0){
                ignoreCreeps = true;
                color='#ff0000';
            } 
            
            var move_ok = dd.move_to_destination(creep);
        }else{//mine
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                var list = creep.room.lookForAt(LOOK_STRUCTURES,creep.pos);
                var container = list.filter((structure)=>{return structure.structureType == STRUCTURE_CONTAINER});
                
                if(container.length == 1 && container[0].hits < 0.8 * container[0].hitsMax){
                    var c = container[0];
                    var repair_ok = creep.repair(c);
                }else{
                    creep.drop(RESOURCE_ENERGY);
                }
            }
            var i = creep.memory.mine_index;
            var s = Game.getObjectById(Memory.res[i].id);
            let mine_ok = creep.harvest(s);
            
        }
    }
    
};

module.exports = roleMiner;