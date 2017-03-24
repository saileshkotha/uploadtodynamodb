function walkclean(x) {
    var type = typeof x;
    if (x instanceof Array) {
        type = 'array';
    }
    if ((type == 'array') || (type == 'object')) {
        for (k in x) {
            var v = x[k];
            if ((v === '') && (type == 'object')) {
                delete x[k];
            } else {
                walkclean(v);
            }
        }
    }
}


a = {
    "hjgjh":"",
    "aqwsedrfgvbhn":"qwertyui"
}

console.log(a)

walkclean(a);
console.log(a)
