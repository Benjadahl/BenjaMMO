var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

console.log('\033[2J');
var startMSG = ["                  Welcome to",
 "       _ ____              _____ ______ _______      ________ _____        ",
 "      | |  _ \\            / ____|  ____|  __ \\ \\    / /  ____|  __ \\       ",
 "      | | |_) |  ______  | (___ | |__  | |__) \\ \\  / /| |__  | |__) |      ",
 "  _   | |  _ <  |______|  \\___ \\|  __| |  _  / \\ \\/ / |  __| |  _  /       ",
 " | |__| | |_) |           ____) | |____| | \\ \\  \\  /  | |____| | \\ \\       ",
 "  \\____/|____/           |_____/|______|_|  \\_\\  \\/   |______|_|  \\_\\      " ,
 "                 Initialising server...",
 "",
 "",
 "",

                ];


for(var i = 0; i < startMSG.length; i++){
    console.log(startMSG[i]);
}

var admins = [];
var users =[];
var usersID={};
var usersNumber = (0);

var blocksChanged = true;
//Checking if a player has moves
var playerPosChanged = false;
//LOOOOL
//Game settings
var movementLength = (1);
var movementSpeed = (50);

var blocks = {};

var mapLimit =  {X: 45, Y: 25, minAreaX: 0, minAreaY: 0, maxAreaX: 30, maxAreaY: 30, artArea:{X: 0, Y:0}};

var startTimer = true;

var blockTypes = {wood: {solid: true}, empty: {solid: false}, stone: {solid: true}, gravel: {solid: false},flower: {solid: false}, grass: {solid: false}, door: {solid: true}, stonefloor: {solid: false}};

var x  = 0;

//function for checking


function getPlayerWithSocketID(socketID){
        for(var i = 0; i < users.length; i++){
            if(typeof users[i] != "undefined"){
                if(typeof usersID[users[i].username] != "undefined"){
                    if(usersID[users[i].username].socketID === socketID){
                        return i;

                    }
                }
            }
    }
    return -1;
}

//Declare all areas on map
console.log("Setting up areas...");
while(mapLimit.artArea.X <= mapLimit.maxAreaX){
    blocks[mapLimit.artArea.X + "_" + mapLimit.artArea.Y] = {};
    mapLimit.artArea.Y++;
    if(mapLimit.artArea.Y > mapLimit.maxAreaY){
        mapLimit.artArea.Y = mapLimit.minAreaY;
        mapLimit.artArea.X++;
    }

}
console.log("Done settings up areas!");


console.log(users[1]);
fs.readFile('./SaveFiles/blocksSave.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log("Could not find blocks save file, making new.");
  }

    blocks = JSON.parse(data);
    console.log("Blocks loaded from file");
});

fs.readFile("./SaveFiles/Players/Security/admins.txt", 'utf8', function(err, data) {
    if(err){
        return console.log("Could not load admin file");
    }
    
   admins = JSON.parse(data);
   console.log("Found and loaded admin file");
});










app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


//New connection
io.on('connection', function(socket){
	console.log("A client connected " + socket.id);

	socket.on("usernameFunction",function(username){
        if(typeof usersID[username] != "undefined" || true){
    	    fs.readFile("./SaveFiles/Players/Player_" + username + ".txt", 'utf8', function (err,data) {
    	        console.log("Trying to load player file");
              if (err) {
                var isAdmin = false;
                if(admins.indexOf(username) != -1){
                    isAdmin = true;
                }
                console.log("A user just pushed " + username);
    		    users.push ({
        			"username": username,
        			"userNumber": usersNumber,
        			"posX" : 0,
        			"posY" : 0,
        			"prevPosY" : 0,
        			"prevPosX" : 0,
        			"cooldown" : false,
        			"areaX" : 0,
        			"areaY" : 0,
        			"inventory" : {wood : 1000, stone: 1000, flower: 1000, grass: 1000, gravel: 1000, door: 1000, stonefloor: 1000},
        			"inventoryArray" : [{type: "grass", quantity : 1000},{type: "wood", quantity : 1000}, {type: "stone", quantity: 1000}, {type: "flower", quantity: 1000}, {type: "gravel", quantity: 1000}, {type: "door", quantity: 1000}, {type: "stonefloor", quantity: 1000}]});
    		    usersID[username]  = {
        			"username": username,
        			"socketID": socket.id,
        			"userNumber": usersNumber,
        			"isAdmin" : false
    		    };
                io.to(socket.id).emit("userNumber", usersNumber, users[usersNumber]);
                io.to(socket.id).emit("startBlocks", blocks);
                usersNumber = usersNumber + 1;
                return console.log("Could not find player save file, Initialising player data");
              }
                var player = JSON.parse(data);
                player.userNumber = usersNumber;
                var isAdmin = false;
                if(admins.indexOf(username) != -1){
                    isAdmin = true;
                }
                usersID[username] = {
                    "username": username,
                    "socketID": socket.id,
                    "userNumber": usersNumber,
                    "isAdmin" : isAdmin
                }
                io.to(socket.id).emit("userNumber", usersNumber, player);
                console.log("Sending blocks");
                io.to(socket.id).emit("startBlocks", blocks);
                users.push(player);
                console.log("Gave " + username + " new ID of " + usersNumber);
                usersNumber++;
                console.log("PLayer loaded from file");
            });
	    }
        /*if(!path.existsSync('./SaveFiles/Players/PLayer_' + username + '.txt')){

            //console.log("Users online: ");
            //console.log(usersID);
        }else{
            //Loading player from saves
            fs.readFile('./SaveFiles/PLayer_' + username + '.txt', 'utf8', function (err,data) {
                if (err) {
                    return console.log("Could not find player save file");
                }

                player = JSON.parse(data);

            });
        }*/
  });



  socket.on("move",function(direction,username,userNumber){
    if(typeof usersID[username] !== "undefined"){
		if(typeof users[userNumber] !== "undefined"){
			if(users[userNumber].username === username){
				if(usersID[users[userNumber].username].socketID === socket.id){
					//if(users[userNumber].cooldown === false){
						users[userNumber].prevPosY = users[userNumber].posY;
						users[userNumber].prevPosX = users[userNumber].posX;
						switch(direction) {
							case "up":
								users[userNumber].posY = users[userNumber].posY - movementLength;
								break;
							case "down":
								users[userNumber].posY = users[userNumber].posY + movementLength;
								break;
							case "right":
								users[userNumber].posX = users[userNumber].posX + movementLength;
								break;
							case "left":
								users[userNumber].posX = users[userNumber].posX - movementLength;
								break;

						}
						users[userNumber].cooldown = true;
						setTimeout(function(){
							users[userNumber].cooldown = false;
						}, movementSpeed);
						try{
						    var block = blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()];
						}catch(err){
						    var user = getPlayerWithSocketID(socket.id);
						    console.log(users[user].username + " fucked up, so just closing the connection to awoid problems");
						    users[user].areaX = 0;
						    users[user].areaY = 0;
						    users[user].posX = 0;
						    users[user].posY = 0;
						    socket.disconnect();
						}
						//console.log("@" + username + " moved " + direction);
						if(typeof block !== "undefined"){
							if(typeof block.solid !== "undefined"){
								if(blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()].solid){
									users[userNumber].posY = users[userNumber].prevPosY;
									users[userNumber].posX = users[userNumber].prevPosX;
									//console.log(block.type);
									//console.log("hej");
								}
							}
						}
						//Changes area
						if(mapLimit.X < users[userNumber].posX && mapLimit.maxAreaX != users[userNumber].areaX){
							users[userNumber].posX = 0;
							users[userNumber].areaX = users[userNumber].areaX + 1;
						}else if(mapLimit.X < users[userNumber].posX && mapLimit.maxAreaX == users[userNumber].areaX){
							users[userNumber].posY = users[userNumber].prevPosY;
							users[userNumber].posX = users[userNumber].prevPosX;
						}
						if(0 > users[userNumber].posX && mapLimit.minAreaX != users[userNumber].areaX){
							users[userNumber].posX = 45;
							users[userNumber].areaX = users[userNumber].areaX - 1;
						}else if(0 > users[userNumber].posX && mapLimit.minAreaX == users[userNumber].areaX){
							users[userNumber].posY = users[userNumber].prevPosY;
							users[userNumber].posX = users[userNumber].prevPosX;
						}
						if(mapLimit.Y < users[userNumber].posY && mapLimit.maxAreaY != users[userNumber].areaY){
							users[userNumber].posY = 0;
							users[userNumber].areaY = users[userNumber].areaY + 1;
						}else if(mapLimit.Y < users[userNumber].posY && mapLimit.maxAreaY == users[userNumber].areaY){
							users[userNumber].posY = users[userNumber].prevPosY;
							users[userNumber].posX = users[userNumber].prevPosX;
						}
						if(0 > users[userNumber].posY && mapLimit.minAreaY != users[userNumber].areaY){
							users[userNumber].posY = 25;
							users[userNumber].areaY = users[userNumber].areaY - 1;
						}else if(0 > users[userNumber].posY && mapLimit.minAreaY == users[userNumber].areaY){
							users[userNumber].posY = users[userNumber].prevPosY;
							users[userNumber].posX = users[userNumber].prevPosX;
						}
						//var block = blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()];
						if(typeof block != "undefined"){
    						switch(block.type){
    						    case "door":
    						        console.log("Player should teleport to " + block.options.toX + ", " + block.options.toY);
    						        users[userNumber].areaX = block.options.toX;
    						        users[userNumber].areaY = block.options.toY;
    						        io.to(socket.id).emit("Teleport", block.options.toX, block.options.toY, users[userNumber].posX, users[userNumber].posY)
    						        break;
    						    
    						}
						}
			
						//console.log(blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()].solid);

					//}
				}
			}
		}
	}
    playerPosChanged = true;

  });




	socket.on("disconnect", function(){
		console.log("A client disconnected " + socket.id);
		var playerNum = getPlayerWithSocketID(socket.id);



		if(typeof users[playerNum] != "undefined"){
		    var player = users[playerNum];
		    fs.writeFile("./SaveFiles/Players/Player_" + player.username + ".txt",JSON.stringify(player), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("Saving player '" + player.userNumber + "' with name '" + player.username + "' to './SaveFiles/Players/player_" + player.username + ".txt'");

            });

		}
		console.log("Deleting player from arrays");
		   try{
            usersID[users[playerNum].username] = "undefined";
            users[playerNum] = "undefined";
		   }catch(err){
		       console.log("Got error then while deleting player");
		   }
		//[DELETE PLAYER HERE]
	});
		//Log client IP
	console.log(socket.request.connection.remoteAddress);
	socket.on("adminBroadcast", function(msg){
		if(socket.request.connection.remoteAddress === "127.0.0.1"){
			io.emit("broadcast",msg);
		}
	});

	socket.on("blockRequest", function(coordsX,coordsY,areaX,areaY,type, userRequest, options){
	    console.log(options);
	    if(typeof usersID[userRequest] !== "undefined"){
			if(usersID[userRequest].socketID === socket.id){
				if (typeof blocks[areaX + "_" + areaY !== "undefined"]){
                    if(type === "empty"){
                    	if(typeof blocks[areaX + "_" + areaY][coordsX + "_" + coordsY] !== "undefined"){
                    		users[usersID[userRequest].userNumber]["inventory"][blocks[areaX + "_" + areaY][coordsX + "_" + coordsY].type]++;
                    		for(x = 0;x < users[usersID[userRequest].userNumber]["inventoryArray"].length; x = x +1){
                    			if(users[usersID[userRequest].userNumber]["inventoryArray"][x].type === blocks[areaX + "_" + areaY][coordsX + "_" + coordsY].type){
                    				users[usersID[userRequest].userNumber]["inventoryArray"][x].quantity++;
                    			}
                    		}
                    		block(coordsX,coordsY,areaX,areaY,type, options);
                    	}
                    }else{
                    	if(users[usersID[userRequest].userNumber]["inventory"][type] > 0){
                    		if(typeof blocks[areaX + "_" + areaY][coordsX + "_" + coordsY] === "undefined" || blocks[areaX + "_" + areaY][coordsX + "_" + coordsY].type === "empty"){
                    			users[usersID[userRequest].userNumber]["inventory"][type] = users[usersID[userRequest].userNumber]["inventory"][type] - 1;
                    			for(x = 0;x < users[usersID[userRequest].userNumber]["inventoryArray"].length; x = x +1){
                    				if(users[usersID[userRequest].userNumber]["inventoryArray"][x].type === type){
                    					users[usersID[userRequest].userNumber]["inventoryArray"][x].quantity--;
                    				}
                    			}
                    			block(coordsX,coordsY,areaX,areaY,type, options);
                    			//console.log(users[usersID[userRequest].userNumber]["inventoryArray"][1].quantity);
                    		}
                    	}
                    }
			    }
			}
		}
	});
	
	socket.on("chatMsg", function(msg){
	   var player = getPlayerWithSocketID(socket.id);
	    if(typeof users[player] != "undefined"){
	        
	        var username = users[player].username;
	    }else{ var username = "NOTHING"; }
	    if(usersID[username].isAdmin == true && msg.charAt(0) == "/"){
	        var command = msg.substring(1, msg.length + 1);
	        console.log("Player " + username + " is executing " + command);
	        execCommand(command);
	    }else{
	        emitMSG(msg, username);
	    }
	   
	});
});

function emitMSG(msg, emitAs){
    io.emit("newMsg", msg, emitAs);
	console.log("[" + emitAs + "] : " + msg);
}

function block(posX, posY, areaX, areaY, type, options){
	if(typeof blocks[areaX + "_" + areaY] === "undefined"){
		blocks[areaX+ "_" + areaY] = {};
	}
	if(typeof blockTypes[type] !== "undefined"){
	    //console.log(blockTypes[type].solid);

		blocks[areaX+ "_" + areaY][posX + "_" + posY] = {"posX" : posX, "posY" : posY, "solid" : blockTypes[type].solid, "type" : type, "options" : options};

		if(!startTimer){
			console.log("Block - X: " + posX + " Y: " + posY + " aX: " + areaX + " aY: " + areaY + " Type: " + type + " Options: " + options);
		}
		blocksChanged = true;
		io.emit("newBlock", posX, posY, areaX, areaY, type, options);
	}
}


/*block(0, 0, 0, 0,  "empty");
block(1, 0, 0, 0,  "empty");
block(2, 0, 0, 0,  "empty");
block(3, 0, 0, 0,  "empty");
block(4, 0, 0, 0,  "empty");
block(0, 1, 0, 0,  "empty");
block(0, 2, 0, 0,  "empty");
block(0, 3, 0, 0,  "empty");
block(0, 4, 0, 0,  "empty");
block(1, 1, 0, 0,  "wood");
block(1, 2, 0, 0,  "empty");
block(1, 3, 0, 0,  "flower");
block(1, 4, 0, 0,  "flower");
block(2, 1, 0, 0,  "grass");
block(2, 2, 0, 0,  "grass");
block(2, 3, 0, 0,  "empty");
block(2, 4, 0, 0,  "empty");
block(3, 1, 0, 0,  "empty");
block(3, 2, 0, 0,  "empty");
block(3, 3, 0, 0,  "empty");
block(3, 4, 0, 0,  "empty");
block(4, 1, 0, 0,  "empty");
block(4, 2, 0, 0,  "empty");
block(4, 3, 0, 0,  "empty");
block(4, 4, 0, 0,  "wood");

block(0, 0, 1, 0,  "empty");
block(1, 0, 1, 0,  "empty");
block(2, 0, 1, 0,  "empty");
block(3, 0, 1, 0,  "empty");
block(4, 0, 1, 0,  "empty");
block(0, 1, 1, 0,  "empty");
block(0, 2, 1, 0,  "empty");
block(0, 3, 1, 0,  "empty");
block(0, 4, 1, 0,  "empty");
block(1, 1, 1, 0,  "empty");
block(1, 2, 1, 0,  "empty");
block(1, 3, 1, 0,  "empty");
block(1, 4, 1, 0,  "empty");
block(2, 1, 1, 0,  "empty");
block(2, 2, 1, 0,  "empty");
block(2, 3, 1, 0,  "empty");
block(2, 4, 1, 0,  "empty");
block(3, 1, 1, 0,  "empty");
block(3, 2, 1, 0,  "empty");
block(3, 3, 1, 0,  "wood");
block(3, 4, 1, 0,  "empty");
block(4, 1, 1, 0,  "empty");
block(4, 2, 1, 0,  "empty");
block(4, 3, 1, 0,  "empty");
block(4, 4, 1, 0,  "empty");

*/

//var text = fs.readFileSync("/home/benjadahl/Desktop/chat-example-mod/Test.txt").toString();
process.on("SIGINT", function(){
	exitFunc();
});


function save(){


    fs.writeFile("./SaveFiles/blocksSave.txt",JSON.stringify(blocks), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("Blocks state saved, closing server");

    });

    for(i = 0; i < users.length; i++){
        var playerNum = i;



		if(typeof users[playerNum] != "undefined"){
		    var player = users[playerNum];
		    fs.writeFile("./SaveFiles/Players/Player_" + player.username + ".txt",JSON.stringify(player), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("Saving player '" + player.userNumber + "' with name '" + player.username + "' to './SaveFiles/Players/player_" + player.username + ".txt'");

            });

		}
    }

}

function exitFunc(){
   //var d = new Date();

    process.exit();

	/*fs.writeFile('/home/benjadahl/Desktop/chat-example-mod/Blocks/test.json', '{' + blocks.toString() + '}');
	throw Error("Ignore the error, the Script was successfully ended and backups have been taken.");*/
}



setInterval(function(){
    if(playerPosChanged){
	    io.emit("sendUsers", users);
	    playerPosChanged = false;
    }
}, 50);

/*setInterval(function(){
	if(blocksChanged){
        io.emit("sendBlocks", blocks);
        blocksChanged = false;
	}
}, 100);*/

setTimeout(function(){
	startTimer = false;
}, 5000);
//var testerinoe = JSON.parse(fs.readFileSync("/home/benjadahl/Desktop/chat-example-mod/Blocks/test.json","utf8"));
//console.log(testerinoe);

http.listen(8080, function(){
  console.log('listening on port: 8080 and 80');
});
setTimeout(function(){
    process.stdout.write("Server> ");
}, 1000);

setInterval(function(){

    if(monitoring.running){
        console.log('\033[2J');
        var map = [];
        for(y = 0; y < mapLimit.Y; y++){
            var line = "";
            for(x = 0; x < mapLimit.X; x++){
                if(typeof blocks[monitoring.areaX + "_" + monitoring.areaY][x + "_" + y] != "undefined"){
                    switch(blocks[monitoring.areaX + "_" + monitoring.areaY][x + "_" + y].type){
                        case "wood":
                            line += "W";
                            break;
                        default:
                            line += "-";
                            break;
                    }
                }else{
                    line += "-";
                }
            }
            map.push(line);
        }
        for(i = 0; i < users.length; i++){
            if(typeof users[i] != "undefined"){
                if(users[i].areaX == monitoring.areaX && users[i].areaY == monitoring.areaY){
                    var Line = map[users[i].posY];
                    var newLine = "";
                    for(x = 0; x < Line.length; x++){

                        if(x == users[i].posX){
                            newLine += "P";

                        }else{
                            newLine += Line.charAt(x);

                        }
                    }
                    map[users[i].posY] = newLine;

                }
            }
        }

        for(i = 0; i < map.length; i++){
            console.log(map[i]);
        }
    }
},2000)

var stdin = process.openStdin();

var monitoring = {running : false, areaX : 0, areaY : 0};

//Command lining
function execCommand (args){
    var helpBoard = ["/---------------------------------------------------------------------\\",
                "|             Welcome to the GameHelpBoard                             |",
                "|  player      Get properties of player with id                        |",
                "|  players     Get all player names                                    |",
                "|  clear       Clear game console                                      |",
                "|  exit        Exit the server                                         |",
                "|  save        Save server state(only blocks)                          |",
                "|  help        How did you even get here                               |",
                "|  makePlayers Spawn a given number of  fake players                   |",
                "|  block       Manually place blocks                                   |",
                "|  monitor     Monitor a specified map, add -a to autorefresh          |",
                "|  say         Emit message to all on server. -n spicifies emitname    |",
                "|                                                                      |",
                "\\---------------------------------------------------------------------/"];
switch(args[0]){
    case "player":
        console.log(users[args[1]]);
        break;

    case "players":
        var i;
        for(i = 0; i < users.length; i++){
            if(typeof users[i] != "undefined"){
                if(typeof usersID[users[i].username] != "undefined"){
                    console.log("Id: " + users[i].userNumber + "  Name: " +
                    users[i].username + "  SocketID: " + usersID[users[i].username].socketID);
                }
            }
        }
        console.log(i + " players in level");
        break;
    case "kick":
        //it will crash
        delete users[args[1]];
        break;
    case "clear":
        console.log('\033[2J');
        break;
    case "exit":
        exitFunc();
        break;
    case "eval":
        //WARNING For debug reasons, comment when not using
        //console.log(eval(args[1]));
        break;
    case "save":
        save();
        break;
    case "block":
        if(args.length === 6){
            console.log("Placing block");
            block(args[1], args[2], args[3], args[4], args[5]);
        }else{
            console.log('Wrong arguments, use "posX, posY, areaX, areaY, blocktype" as arguments');
        }
        break;
    case "say":
        var emitname = "";
        var emitmsg = "";
        for(var i = 1; i < args.length; i++){
            if(args[i] == "-n"){
                emitname = args[i + 1];
                i++;
            }else{
                emitmsg += args[i] + " ";
            }
        }
        if(emitname == ""){
            emitMSG(emitmsg, "Server");
        }else{
            emitMSG(emitmsg, emitname);
        }
        break;
    case "monitor":
        if(args[3] === "-a"){
            monitoring.running = true;
            monitoring.areaX = args[1];
            monitoring.areaY = args[2];
            break;
        }
        var map = [];
        for(y = 0; y < mapLimit.Y; y++){
            var line = "";
            for(x = 0; x < mapLimit.X; x++){
                if(typeof blocks[args[1] + "_" + args[2]][x + "_" + y] != "undefined"){
                    switch(blocks[args[1] + "_" + args[2]][x + "_" + y].type){
                        case "wood":
                            line += "W";
                            break;
                        case "door":
                            line += "D";
                            break;
                        case "grass":
                            line += "G";
                            break;
                        default:
                            line += "-";
                            break;
                    }
                }else{
                    line += "-";
                }

            }
            map.push(line);
        }
        for(i = 0; i < users.length; i++){
            if(typeof users[i] != "undefined"){
                if(users[i].areaX == args[1] && users[i].areaY == args[2]){
                    var Line = map[users[i].posY];
                    var newLine = "";
                    for(x = 0; x < Line.length; x++){

                        if(x == users[i].posX){
                            newLine += "P";

                        }else{
                            newLine += Line.charAt(x);

                        }
                    }
                    map[users[i].posY] = newLine;

                }
            }
        }
        for(i = 0; i < map.length; i++){
            console.log(map[i]);
        }
        break;
    case "help":

        //Write command desciption here
        for(i = 0; i < helpBoard.length; i++){
            console.log(helpBoard[i]);

        }
        break;
    case "makeplayers":
        for(i = 0; i < args[1]; i++){
            users.push ({
			"username": "user" + usersNumber,
			"userNumber": usersNumber,
			"posX" : 0,
			"posY" : 0,
			"prevPosY" : 0,
			"prevPosX" : 0,
			"cooldown" : false,
			"areaX" : 0,
			"areaY" : 0,
			"inventory" : {wood : 1000, stone: 2, flower: 0, grass: 0, gravel: 5},
			"inventoryArray" : [{type: "grass", quantity : 0},{type: "wood", quantity : 1000}, {type: "stone", quantity: 2}, {type: "flower", quantity: 0}, {type: "gravel", quantity: 5}]
		});
		usersID["user" + usersNumber]  = {
			"username": "user" + usersNumber,
			"socketID": "CPUMADE_" + usersNumber,
			"userNumber": usersNumber
		};

            usersNumber = usersNumber + 1;
        }
        console.log("Y U DO DIS");
        break;
    case "yope":
        console.log("HELLO JULIAN J. Teule, HOW ARE YOU. :-)");
        break;
    default:
        console.log("WHAT ARE THOOOOOOOSSSE");
    }


    process.stdout.write("Server> ");
}



stdin.addListener("data", function(d) {
    if(monitoring.running === true){
        monitoring = false;
    }
    var args = [];
    var carg = "";
    var argnum = 0;
    var input = d.toString().trim();
    var command = input.toLowerCase();
    for(i = 0; i < command.length; i++){
        if(command.charAt(i) === " "){
            args.push(carg);
            carg = "";
        }else{
            carg += command.charAt(i);
        }
    }
    
    
    args.push(carg);
    
    execCommand(args);


});
