//All of the code is to check if libraries are up to date
const GitOwner = "itsvyle";
const GitName = "gm-server";
const GitMaxCommits = 5;

const resetColor = "\x1b[0m";
const redColor = "\x1b[31m";

var Util,fs;
/**
 * Import the libraires with options
 */
function GMServer({update = false} = {}) {
    if (update) {
        process.stdout.write(resetColor);
        if (!fs) fs = require("fs");
        let dir = fs.statSync(__dirname);
        var dt_birth = dir.birthtime.toISOString();
        
        let url = `https://api.github.com/repos/${GitOwner}/${GitName}/commits?per_page=20`;
        if (!Util.request.request) Util.request.setRequest();
        Util.request(url,{json: true,
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-agent": "@itsvyle/gm-server"
            }
        }).then((r) => {
            let res = r.res;
            if (!Array.isArray(res)) return console.error(redColor,"[gm-server,Update] Error fetching latests commits: invalid response format",resetColor);
            var len = res.length,i,upToDate = [],d,firstDate = null;
            for(i = 0;i < len;i++) {
                let c = res[i];
                if (!c.commit) continue;
                d = c.commit.author.date;
                if (d < dt_birth && i === 0) {
                    upToDate = true;
                    break;
                } else if (d < dt_birth) {
                    break;
                }
                firstDate = d;
                upToDate.push(`@${c.commit.author.name} at ${d}: '\x1b[4m${c.commit.message}${resetColor}\x1b[33m' / ${c.html_url}`);
            }
            
            if (upToDate === true) {return;}
            console.log("\x1b[33m",`[gm-server,Update] Libraries are not up to date since ${firstDate} (${Util.formatTime(Date.now() - (new Date(firstDate)).getTime())})`);
            len = upToDate.length;
            upToDate = upToDate.slice(0,GitMaxCommits).join("\n- ") + ((len <= GitMaxCommits) ? "" : "\n+" (len - GitMaxCommits) + " items");
            console.log(`There were *${len}* updates since last downloaded:\n- ${upToDate}`);
            console.log("\x1b[32m","[gm-server,Update] Command to type: " + `git clone https://github.com/${GitOwner}/${GitName}.git`);
            process.stdout.write(resetColor);
        }).catch((r) => {
            console.error(redColor,`[gm-server,Update] ${r.error}`,resetColor);
        });
    }
    return GMServer;
}
GMServer.Collection = require("./collection.js");
GMServer.Util = Util = require("./util.js");
GMServer.Sessions = require("./sessions.js");
GMServer.Flags = require("./flags.js");

module.exports = GMServer;
