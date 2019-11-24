const MAX_SLEEP_TIME = 20;
const MAX_SLEEP_COUNTDOWN = 50;

var weapon = {
    run : function(){
        var tower = Game.getObjectById('5910c641d68e6f46a4f20af5');
        
        if(tower) {
            if(typeof Memory.tower_sleep_countdown === 'undefined') Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
            if(typeof Memory.tower_sleeped === 'undefined') Memory.tower_sleeped = 0;
            if(Memory.tower_sleep_countdown == 0){
                console.log('tower slept');
                Memory.tower_sleeped++;
                if(Memory.tower_sleeped > MAX_SLEEP_TIME){
                    Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
                }
                return;
            }
            
            Memory.tower_sleep_countdown--;
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
                Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
            }else{
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax
                });
                if(closestDamagedStructure) {
                    if(closestDamagedStructure.pos.inRangeTo(tower,5))
                    tower.repair(closestDamagedStructure);
                    Memory.tower_sleep_countdown = MAX_SLEEP_COUNTDOWN;
                }
            }
            
        }
    }
        
}

module.exports = weapon;