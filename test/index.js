var crushinator = require('../index');

crushinator('application/dist', { modulesDir: 'application/node_modules' }, function (err, results) {
    if (err) {
        return console.log(err);
    }

    console.log('SUCCESS!!!');
});