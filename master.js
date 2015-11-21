var app = require(__dirname + '/pm').createMaster({
    'pidfile': __dirname + '/bench.pid',
    // 'statusfile': __dirname + '/status.log',
    'statusflush_interval': 10000,
    'terminate_timeout': 1000,
});

app.on('quit', function() {
    console.log('quit', arguments);
});

app.register('serial', __dirname + '/worker/controllers/iqiyi.js', {
    'children': 2,
    'use_serial_mode': true
});

app.dispatch();
