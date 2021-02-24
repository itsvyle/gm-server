const {Util} = require("./gm-server");
const app = Util.express({
    port: 3000,
    post: true
});

const SimpleDB = require("./gm-server/simple-db");
const db = new SimpleDB([
    "id",
    {
        name: "count",
        type: "number",
        required: true,
        // values: [1,2,3]
    },
    {
        name: "kill",
        type: "boolean"
    },
    {
        name: "test",
        type: "string",
        primer: s => s.toUpperCase()
    }
],null,null,[
    {
        name: "source",
        type: "number"
    }
]);

db.mapBy = "id";

//With login:
//app.use("/data",login.expressAuths([]),db.router(app.express));

app.use("/data",db.router(app.express));

db.start(function () {
    console.log("[db] Loaded data");
    app.connect((port) => {
        console.log("App listning at port: " + port);
    });
});
