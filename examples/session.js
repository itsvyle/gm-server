//======================= IMPORT READLINE FOR DEV =======================
const resetColor = "\x1b[0m";
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function askReadCommand() {
    rl.question("Command:", (answer) => {
        console.log("\x1b[34m",answer,resetColor);
        try {
            var m = eval(answer);
        } catch (e) {
            //console.error(e);
        }
        if (!m) {m = "Done";}
        console.log("\x1b[34m",m || "No return",resetColor);
        askReadCommand();
    });
}
askReadCommand();


const express = require('express');
const app = express();
const port = 8000;//3000;
var expressWs = require('express-ws')(app);
var bodyParser = require('body-parser');
const fs = require("fs");

const Sessions = require("./sessions.js");

const sessions = new Sessions(10 * 1000);

sessions.events.on("session_close",function (s,event) {//event is for ws (doesn't work)
    console.log("close",s);
});
sessions.events.on("session_timeout",function (s) {
    console.log("timeout",s);
});
sessions.events.on("session_create",function (s) {
    console.log("create",s);
});

sessions.events.on("message",function (s,m) {
    console.log("message",s,m);
});

function t() {
    sessions.createSession("messages",{});
}
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb",extended: true}));


app.use("/sessions",sessions.getRouter(true));

app.use("*",function (req,res) {
    var url = req._parsedUrl;
    
    if (url.pathname.endsWith("/")) {url.pathname += 'index.html';}
    var filename = './public' + url.pathname;
    res.set('Cache-Control','no-cache');
	fs.readFile(filename, function(err, data) {
		if (err) {
			//res.sendStatus(404);
			res.status(404);
			return res.send('404 Not Found');
		}
		if (filename.endsWith('.css')) {
			res.set('Content-Type', 'text/css; charset=UTF-8');
		} else if (filename.endsWith('.html')) {
			res.set('Content-Type', 'text/html; charset=UTF-8');
		} else if (filename.endsWith('.js')) {
			res.set('Content-Type', 'application/javascript');
		} else if (filename.endsWith('.png')) {
            res.set('Content-Type', 'image/png');
        } else if (filename.endsWith('.mp3')) {
            res.set('Content-Type', 'audio/mp3');
        }
		res.status(200);
		res.send(data);
	});
});

app.listen(port,() => {
    console.clear();
    console.log(`App listening at port: ${port}`);
    //t();
});

//CLIENT SIDE:
gm.onload(onload);
var not,session;
function onload() {
    not = new gm.NotificationMessages();
    session = new gm.Server.Session("/sessions","test");
    session.onError = function (e) {
        not.addMessage(e,"background-color: red;",5000,true);
    }
    session.onMessage = function (m) {
        console.log(m);
    };
    session.start();
}
