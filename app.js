var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/docs'));
app.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'));
});