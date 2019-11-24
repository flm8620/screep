var tools = require('tools');
var dd = require('destinations');


function change_mode_taking(creep){
    dd.clear_destination(creep);
    creep.say('take');
    creep.memory.goto_store = false;
    var r_id = dd.pick_resource_id(creep);
    if(!r_id) return null;
    creep.memory.resource_id = r_id;
    creep.memory.mining_timer = 0;
    creep.memory.patience = PATIENCE_MAX;
    var miner_id = Memory.res[r_id].miner_id;
    if(!Game.getObjectById(miner_id)){
        creep.memory.miner_id = null;
        creep.say('no miner');
        return false;
    }
    creep.memory.miner_id = miner_id;
    return dd.set_id_as_destination(creep, miner_id);
}

function change_mode_storing(creep){
    //console.log(JSON.stringify(creep));
    creep.say('storing');
    creep.memory.goto_store = true;
    var id = dd.pick_non_full_store_id(creep);
    if(!id){
        id = dd.pick_tower_id(creep);
    }
    
    creep.memory.patience = PATIENCE_MAX;
    return dd.set_id_as_destination(creep, id);
}

const PATIENCE_MAX = 20;
var roleTranspoter = {
    run: function(creep) {
        if(creep.spawning) return;
        if(!creep.memory.goto_store) {//taking
            
            if(creep.store.getFreeCapacity(RESOURCE_ENERGY).energy == 0){
                change_mode_storing(creep);
                
            }else{
                
                if(!creep.memory.miner_id){
                    change_mode_taking(creep);
                    return;
                }
                
                if(!dd.has_destination(creep)){
                    change_mode_taking(creep);
                    return;
                }
                
                creep.memory.mining_timer++;
                

                
                if(!dd.is_near_destination(creep)){
                    var ran = _.random(0,1);
                    var ignoreCreeps = false;
                    var color = '#ffffff';
                    
                    if(ran == 0){
                        ignoreCreeps = true;
                        color='#ff0000';
                    } 
                    
                    var move_ok = dd.move_to_destination(creep,{visualizePathStyle: {stroke: color}, ignoreCreeps});
                    
                    if(move_ok == ERR_NO_PATH){
                        creep.say('NO PATH '+creep.memory.patience);
                        creep.memory.patience--;
                        if(creep.memory.patience < PATIENCE_MAX) {
                            creep.say('wait '+creep.memory.patience);
                        }
                    }
                    if(creep.memory.patience<=0){
                        change_mode_taking(creep);
                    }
                }else{
                    var miner = Game.getObjectById(creep.memory.miner_id);                    
                    if(!creep.pos.isNearTo(miner)){
                        creep.say('retrace miner');
                        change_mode_taking(creep);
                        return;
                    }
                    
                    var list = creep.room.lookForAt(LOOK_STRUCTURES,miner.pos);
                    var container = list.filter((structure)=>{return structure.structureType == STRUCTURE_CONTAINER});
                    
                    if(container.length == 1 && container[0].store[RESOURCE_ENERGY] > 0){
                        var c = container[0];
                        var draw_ok = creep.withdraw(c,RESOURCE_ENERGY);
                        console.log(JSON.stringify(draw_ok));
                    }else{
                        list = creep.room.lookForAt(LOOK_RESOURCES,miner.pos);
                        if(list.length == 0){
                            creep.say('wait drop');
                            return;
                        }
                        var drop = list[0];
                        
                        
                        let mine_ok = creep.pickup(drop);
                    }
                    
                }
            }
        }
        
        if(creep.memory.goto_store) {//storing
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                change_mode_taking(creep);
            }else{
                
                if(!dd.has_destination(creep)){
                    change_mode_storing(creep);
                    return;
                }
                
                if(!dd.is_near_destination(creep)){
                    dd.move_to_destination(creep,{visualizePathStyle: {stroke: '#ffffff'}, ignoreCreeps : false});
                    
                }else{
                    let store = dd.get_dest_obj(creep);
                    let store_ok = creep.transfer(store, RESOURCE_ENERGY);
                    if(store_ok == OK){
                        if(creep.memory.resource_id){
                            console.log(creep.memory.resource_id + ' resource timer = '+creep.memory.mining_timer)
                            Memory.res[creep.memory.resource_id].history_time *= 0.8;
                            Memory.res[creep.memory.resource_id].history_time += 0.2 * creep.memory.mining_timer;
                            creep.memory.mining_timer = 0;
                            creep.memory.resource_id = '';
                        }else{
                        }
                    }
                    if(creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0){
                        change_mode_taking(creep);
                    }else{
                        change_mode_storing(creep);
                    }
                }
                
            }
        }
    }
};

module.exports = roleTranspoter;