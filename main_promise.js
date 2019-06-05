//load libraries
const express = require('express');
const request = require('request');
const hbs = require('express-handlebars');
const mysql = require('mysql');

//SQC query statements
const SQL_SELECT_FILM = 'select film_id, title, description from film where title like ?'
const SQL_SELECT_FILM_PAGE = 'select film_id, title, description from film where title like ? limit ? offset ?'
const SQL_COUNT_TOTAL = 'select count(*) as totalNum from film where title like ?'

//Tunables --> port
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || 3000);

//create connection pool
const pool = mysql.createPool(require('./config.json'));

//create an instance of application
const app = express();

//configure handlebars
app.engine('hbs', hbs());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

//route handlers
app.get('/search', (req,res) => {
    const titleName = req.query.titleName;
    //checkout a connection from the pool
    pool.getConnection((err,conn) => {
        if(err) {
            res.status(500);
            res.type('text/plain');
            res.send(err);
            return;
        }
        //perform our query
        conn.query(SQL_COUNT_TOTAL,
            [`%${titleName}%`],
            (err, res_count) => {
            //dont release the connection as it is needed for 2nd query
            //conn.release();
            if (err) {
                res.status(500);
                res.type('text/plain');
                res.send(err);
                return;
            }
            //console.log(res_count);
            const count = res_count[0].totalNum;
            //console.log(count);

            conn.query(SQL_SELECT_FILM_PAGE,
                [`%${titleName}%`, 10, 0],
                (err, result) => {
                //release the connection to free up connection slot
                conn.release();
                if (err) {
                    res.status(500);
                    res.type('text/plain');
                    res.send(err);
                    return;
                }
                //console.log(result)
                res.status(200);
                res.type('text/html');
                res.render('movie', {
                    layout : false,
                    noResult : result.length <= 0,
                    titleName : titleName,
                    movie : result,
                    countNum : count
                });
            })

        })
        /*conn.query(SQL_SELECT_FILM_PAGE,
            [`%${titleName}%`, 10, 0],
            (err, result) => {
            //release the connection to free up connection slot
            conn.release();
            if (err) {
                res.status(500);
                res.type('text/plain');
                res.send(err);
                return;
            }
            res.status(200);
            res.type('text/html');
            res.render('movie', {
                layout : false,
                noResult : result.length <= 0,
                titleName : titleName,
                movie : result,
                countNum : res_count
            });
        })*/
    })
})

app.get(/.*/, express.static(__dirname + '/public'))

app.listen(PORT, () => {
    console.info(`Application started on ${new Date()} at port ${PORT}`)
})
