//#region CONFIGURACION SERVIDOR
var port = process.env.PORT || /*Puerto de la aplicacion*/ 5025;
//#endregion
//#region DEPENDENCIAS
const express = require('express');
var app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

var http = require('http');
app.use(cookieParser());
app.use(express.static(__dirname));
app.use(bodyParser.json({limit: '20mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}))

app.use(cors());
//#region ARRANCANDO EL SERVIDOR NODE PARA LA APLICACIÓN

/*
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
    res.header("Access-Control-Allow-Headers", "content-type, Authorization, Content-Length, X-Requested-With, Origin, Accept");
    //res.header("Access-Control-Allow-Headers", "content-type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    next();
});**/

//#region Invocando el router
require('./route.js')(app);
//#endregion
var server = http.createServer(app);
server.listen(process.env.PORT || port, function () {
    console.log('API iniciada para servir en el puerto: ' + port);
});
//#endregion
//#endregion
