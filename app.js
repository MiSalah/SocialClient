var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('morgan');
var bodyParser = require('body-parser');
const neo4j = require('neo4j-driver')

var app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));


const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic("neo4j", "123456"))
const session = driver.session()


// Home Route
app.get('/', function(req, res){

    session
        .run("MATCH (n) RETURN n")
        .then(function(result) {
            result.records.forEach(function(record){
                console.log(record._fields[0]);
            });
        })
        .catch(function(error){
            console.log(error);
        });
    res.render('index');

})
app.listen(3000);


console.log('Server started on port 3000');

module.exports = app;