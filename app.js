var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver')

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

    var lastname = req.body.lastname;
    var firstname = req.body.firstname;
    //console.log(lastname);
    
    session.run("CREATE (a:Person {firstname: $firstnameP, lastname: $lastnameP}) RETURN a",
    { firstnameP: firstname, lastnameP: lastname})
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
        .catch(function(error){
            console.log(error);
        })

});

// Friends Connection route 
app.post('/friends/connect', function(req, res){
    
    
    var name1 = req.body.name1;
    var name2 = req.body.name2;
    var date = req.body.date;

    session.run("MATCH (a:Person {lastname:$nameParam1}),(b:Person {lastname : $nameParam2}) MERGE(a)-[r:FRIENDS {since: $dateP}]->(b) RETURN a,b",{ nameParam1: name1 , nameParam2 :name2 , dateP: date})
    
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        })
});

// Add Birthplace Route
app.post('/person/born/add', function(req, res){
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var city = req.body.city;
    var country = req.body.country;
    var year = req.body.year;

    session.run("MATCH (a:Person {firstname:$firstnameP, lastname:$lastnameP}),(l:location {city: $cityP, country: $countryP}) MERGE(a)-[r:BORN_IN {year: $yearP}]->(l) RETURN a,l",
    { firstnameP: firstname , lastnameP :lastname, cityP: city, countryP: country, yearP: year })
    
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        })

});

// add living place 
app.post('/person/live/add', function(req, res){
    
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var city = req.body.city;
    var country = req.body.country;
    var since = req.body.since;

    session.run("MATCH (a:Person {firstname:$firstnameP, lastname:$lastnameP}),(l:location {city: $cityP, country: $countryP}) MERGE(a)-[r:LIVE_IN {since: $sinceP}]->(l) RETURN a,l",
    { firstnameP: firstname , lastnameP :lastname, cityP: city, countryP: country, sinceP: since })
    
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        })

});

// Person detail route
app.get('/person/:id', function(req, res){

    var id = req.params.id;

    session.run("MATCH(a:Person) WHERE id(a)=toInteger($idParam) RETURN a.lastname as lastname , a.firstname as firstname",
    {idParam:id})
    .then(function(result){

        var lastname = result.records[0].get("lastname");
        var firstname = result.records[0].get("firstname");

        session.run("OPTIONAL MATCH (a:Person)-[r:BORN_IN]-(l:location) WHERE id(a)=toInteger($idParam) RETURN l.city as city, l.country as country",
        {idParam:id})
        .then(function(result2){
            var city = result2.records[0].get("city");
            var country = result2.records[0].get("country");

            session.run("OPTIONAL MATCH (a:Person)-[r:FRIENDS]-(b:Person) WHERE id(a)=toInteger($idParam) RETURN b",
            {idParam: id} )
            .then(function(result3){

                var friendsList = [];

                result3.records.forEach(function(record){
                    if(record._fields[0] != null){

                        friendsList.push({
                            id : record._fields[0].identity.low,
                            lastname : record._fields[0].properties.lastname,
                            firstname : record._fields[0].properties.firstname
                        });
                    }
                });
                
                res.render('personsInfos',{
                    id: id,
                    lastname: lastname,
                    firstname: firstname,
                    city: city,
                    country: country,
                    friends : friendsList
                }); 

                console.log(id);
                console.log(firstname);
                console.log(lastname);
                console.log(city);
                console.log(country);
                console.log(friendsList);

            })
            .catch(function(error){
                console.log(error);
                return res.status(404).json({error})
            });
        });    
    });
});

app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;