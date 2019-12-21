var utils = {
    random_idx_with_probability: function (probs) {
        let sum = 0;
        for (var i = 0; i < probs.length; i++) sum += probs[i];
        let s = 0;
        let r = Math.random() * sum;
        for (var i = 0; i < probs.length; i++) {
            s += probs[i];
            if (r <= s)
                return i;
        }
    },
    get_or_zero: function (obj, field) {
        if (field in obj)
            return obj[field];
        return 0;
    }
}
module.exports = utils;