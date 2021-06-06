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


var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic("neo4j", "123456"))
var session = driver.session()


// Home Route
app.get('/', function(req, res){

    session
        .run("MATCH (n:Person) RETURN n")
        .then(function(result) {

            var persons = [];

            result.records.forEach(function(record){
                //console.log(record._fields[0]);
            persons.push({
                id: record._fields[0].identity.low,
                firstname: record._fields[0].properties.firstname,
                lastname: record._fields[0].properties.lastname
                 });
            });

            session.run("MATCH (l:location) RETURN l")
                    .then(function(result2){

                        var locations = [];
                        result2.records.forEach(function(record){
                            locations.push(record._fields[0].properties);
                        });

                        res.render('index',{
                            personsList : persons,
                            locationList : locations
                        });
                    })

 
        })
        .catch(function(error){
            console.log(error);
        });
});

// Add person route
app.post('/person/add', function(req, res){

    var name = req.body.name;
    console.log(name);
    
    session.run("CREATE (a:Person {lastname: $nameParam}) RETURN a",{ nameParam: name })
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        })
});

// Add location route
app.post('/location/add', function(req, res){
    
    
    var city = req.body.city;
    var country = req.body.country;

    session.run("CREATE (l:location {city: $CityName, country: $CountryName}) RETURN l",{ CityName: city , CountryName :country })
    //CREATE (u:User {userId: {u.userId}, email: {u.email}, ...}) RETURN u", {u: user})
    //CREATE (l:location{city: 'Settat', country: 'Morocco'}) return l
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error)
        {
            console.log(error);
        }
        )

});

// Friends Connection route l
app.post('/friends/connect', function(req, res){
    
    
    var name1 = req.body.name1;
    var name2 = req.body.name2;

    session.run("MATCH (a:Person {lastname:$nameParam1}),(b:Person {lastname : $nameParam2}) MERGE(a)-[r:FRIENDS]->(b) RETURN a,b",{ nameParam1: name1 , nameParam2 :name2 })
    
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error)
        {
            console.log(error);
        }
        )

});


app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;