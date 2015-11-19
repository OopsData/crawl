var app = require(__dirname + '/pm').createMaster({
    'pidfile': __dirname + '/bench.pid',
    'statusfile': __dirname + '/status.log',
    'statusflush_interval': 10000,
    'terminate_timeout': 1000,
});

// ---------------------
app.on('giveup', function(name, fatals, pause) {
    console.log('Master giveup to restart "%s" process after %d times. pm will try after %d ms.', name, fatals, pause);
});

app.on('disconnect', function(worker, pid) {
    // var w = cluster.fork();
    console.error('[%s] [master:%s] wroker:%s disconnect! new worker:%s fork',
        new Date(), process.pid, worker.process.pid); //, w.process.pid);
});

app.on('fork', function() {
    console.log('fork', arguments);
});

app.on('quit', function() {
    console.log('quit', arguments);
});

// -----------------------
app.register(
    'http',
    __dirname + '/worker/controllrs/iqiyi.js', 
    {'children': 1}
);

app.dispatch();
