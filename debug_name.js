
const DEBUG_NAME = '';
let creep_name = '';


var debugName = {
    DEBUG_ON: false,
    set_creep_name : function(name){
        creep_name = name;
        debugName.DEBUG_ON = DEBUG_NAME === creep_name;
    },
    log : function (msg) {
        if (debugName.DEBUG_ON)
            console.log(`[${creep_name}]: ${msg}`);
    }
};

module.exports = debugName;