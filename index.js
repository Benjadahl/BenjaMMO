var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var  p1mTopServer = (0);
var p1mLeftServer = (0);

var p2mTopServer = (0);
var p2mLeftServer = (0);

var users =[];
var usersID=[];
var usersNumber = (0);

//Game settings
var movementLength = (1);
var movementSpeed = (50);

var blocks = {};
var blocksClient = {};

var mapLimit =  {X: 45, Y: 25, minAreaX: 0, minAreaY: 0, maxAreaX: 3, maxAreaY: 3,}

var startTimer = true;

var blockTypes = {wood: {solid: true}, empty: {solid: false}, stone: {solid: true}, gravel: {solid: false},flower: {solid: false}, grass: {solid: false}}

var x  = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log("A client connected " + socket.id);
	
	socket.on("usernameFunction",function(username){
	  if(typeof usersID[username] === "undefined"){
		console.log("A user just pushed " + username);
		users.push ({
			"username": username,
			"posX" : 0,
			"posY" : 0,
			"prevPosY" : 0,
			"prevPosX" : 0,
			"cooldown" : false,
			"areaX" : 0,
			"areaY" : 0,
			"userNumber": usersNumber,
			"inventory" : {wood : 5, stone: 2, flower: 0, grass: 0, gravel: 5},
			"inventoryArray" : [{type: "grass", quantity : 0},{type: "wood", quantity : 5}, {type: "stone", quantity: 2}, {type: "flower", quantity: 0}, {type: "gravel", quantity: 5}]
		});
		console.log(users[usersNumber].inventory);
		usersID[username]  = {
			"username": username,
			"socketID": socket.id,
			"userNumber": usersNumber
		}
		io.to(socket.id).emit("userNumber", usersNumber);
		usersNumber = usersNumber + 1;
		console.log("Users online: ");
		console.log(usersID);  
	  }else{
		 console.log("Client: " + socket.id + "is trying to push username that already is defined: " + username); 
		  io.to(socket.id).emit("usernameTaken");
	  }
  });
  
  socket.on("move",function(direction,username,userNumber){
	 if(typeof usersID[username] !== "undefined"){
		if(typeof users[userNumber] !== "undefined"){
			if(users[userNumber].username === username){ 
				if(usersID[users[userNumber].username].socketID === socket.id){
					if(users[userNumber].cooldown === false){
						users[userNumber].prevPosY = users[userNumber].posY
						users[userNumber].prevPosX = users[userNumber].posX
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
						console.log("@" + username + " moved " + direction);
						if(typeof blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()] !== "undefined"){
							if(typeof blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()] !== "undefined"){
								if(blocks[users[userNumber].areaX.toString() + "_" + users[userNumber].areaY.toString()][users[userNumber].posX.toString() + "_" + users[userNumber].posY.toString()].solid){
									users[userNumber].posY = users[userNumber].prevPosY
									users[userNumber].posX = users[userNumber].prevPosX
								}	
							}
						}
						//Changes area
						if(mapLimit.X < users[userNumber].posX && mapLimit.maxAreaX !== users[userNumber].areaX){
							users[userNumber].posX = 0;
							users[userNumber].areaX = users[userNumber].areaX + 1;
						}else if(mapLimit.X < users[userNumber].posX && mapLimit.maxAreaX === users[userNumber].areaX){
							users[userNumber].posY = users[userNumber].prevPosY
							users[userNumber].posX = users[userNumber].prevPosX
						}
						if(0 > users[userNumber].posX && mapLimit.minAreaX !== users[userNumber].areaX){
							users[userNumber].posX = 45;
							users[userNumber].areaX = users[userNumber].areaX - 1;
						}else if(0 > users[userNumber].posX && mapLimit.minAreaX === users[userNumber].areaX){
							users[userNumber].posY = users[userNumber].prevPosY
							users[userNumber].posX = users[userNumber].prevPosX
						}
						if(mapLimit.Y < users[userNumber].posY && mapLimit.maxAreaY !== users[userNumber].areaY){
							users[userNumber].posY = 0;
							users[userNumber].areaY = users[userNumber].areaY + 1;
						}else if(mapLimit.Y < users[userNumber].posY && mapLimit.maxAreaY === users[userNumber].areaY){
							users[userNumber].posY = users[userNumber].prevPosY
							users[userNumber].posX = users[userNumber].prevPosX
						}
						if(0 > users[userNumber].posY && mapLimit.minAreaY !== users[userNumber].areaY){
							users[userNumber].posY = 25;
							users[userNumber].areaY = users[userNumber].areaY - 1;
						}else if(0 > users[userNumber].posY && mapLimit.minAreaY === users[userNumber].areaY){
							users[userNumber].posY = users[userNumber].prevPosY
							users[userNumber].posX = users[userNumber].prevPosX
						}
					}	
				}
			}
		}
	}

		
  });
  

  
	socket.on("disconnect", function(){
		console.log("A client disconnected " + socket.id);
	});
		//Log client IP
	console.log(socket.request.connection.remoteAddress);
	socket.on("adminBroadcast", function(msg){
		if(socket.request.connection.remoteAddress === "127.0.0.1"){
			io.emit("broadcast",msg);
		}
	});
	socket.on("blockRequest", function(coordsX,coordsY,areaX,areaY,type,userRequest){
			if(typeof usersID[userRequest] !== "undefined"){
				if(usersID[userRequest].socketID === socket.id){
					if(type === "empty"){
						if(typeof blocks[areaX + "_" + areaY][coordsX + "_" + coordsY] !== "undefined"){
							users[usersID[userRequest].userNumber]["inventory"][blocks[areaX + "_" + areaY][coordsX + "_" + coordsY].type]++;
							for(x = 0;x < users[usersID[userRequest].userNumber]["inventoryArray"].length; x = x +1){
								if(users[usersID[userRequest].userNumber]["inventoryArray"][x].type === blocks[areaX + "_" + areaY][coordsX + "_" + coordsY].type){
									users[usersID[userRequest].userNumber]["inventoryArray"][x].quantity++;
								}
							}
							block(coordsX,coordsY,areaX,areaY,type);
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
								block(coordsX,coordsY,areaX,areaY,type);
								console.log(users[usersID[userRequest].userNumber]["inventoryArray"][1].quantity);
							}
						}
					}
				}		
			}
	});
});

function block(posX, posY, areaX, areaY, type){
	if(typeof blocksClient[areaX + "_" + areaY] === "undefined"){
		blocksClient[areaX+ "_" + areaY] = [];
	}
	if(typeof blocks[areaX + "_" + areaY] === "undefined"){
		blocks[areaX+ "_" + areaY] = {};
	}
	if(typeof blockTypes[type] !== "undefined"){
		if(blockTypes[type].solid){
			blocksClient[areaX + "_" + areaY].push({"posX" : posX, "posY" : posY, "solid" : true, "type" : type});
			blocks[areaX+ "_" + areaY][posX + "_" + posY] = {"posX" : posX, "posY" : posY, "solid" : true, "type" : type}
		}else if(!blockTypes[type].solid){
			blocksClient[areaX + "_" + areaY].push({"posX" : posX, "posY" : posY, "solid" : false, "type" : type});
			blocks[areaX+ "_" + areaY][posX + "_" + posY] = {"posX" : posX, "posY" : posY, "solid" : false, "type" : type}
		}
		if(!startTimer){
			console.log("Block - X: " + posX + " Y: " + posY + " aX: " + areaX + " aY: " + areaY + " Type: " + type);
		}
	}
}

block(0, 0, 0, 0,  "empty");
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

//var text = fs.readFileSync("/home/benjadahl/Desktop/chat-example-mod/Test.txt").toString();
process.on("SIGINT", function(){
	exitFunc();
});


function exitFunc(){
	fs.writeFile('/home/benjadahl/Desktop/chat-example-mod/Blocks/test.json', '{' + blocks.toString() + '}');
	throw Error("Ignore the error, the Script was successfully ended and backups have been taken.");
}

setInterval(function(){
	io.emit("sendUsers", users);	  
}, 20);

setInterval(function(){  
	io.emit("sendBlocks", blocksClient,blocks);
}, 1000);

setTimeout(function(){
	startTimer = false;
}, 5000);
//var testerinoe = JSON.parse(fs.readFileSync("/home/benjadahl/Desktop/chat-example-mod/Blocks/test.json","utf8"));
//console.log(testerinoe);

http.listen(3000, function(){
  console.log('listening on *:3000');
});
