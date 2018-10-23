var LEFT=37;
var RIGHT=39;
var UP=38;
var DOWN=40;
var POINT_RADIUS=40;
var FIELD_WIDTH=30;
var FIELD_HEIGHT=20;
var START_SIZE = 4;
var score;
var gameOver=false;


var example = document.getElementById("example"),
    ctx = example.getContext('2d');

example.width  = FIELD_WIDTH*POINT_RADIUS;
example.height = FIELD_HEIGHT*POINT_RADIUS;

ctx.font = 'bold 100px sans-serif';
ctx.strokeText("Waiting for player 2", 80, example.height/2);

var snakeX = Math.round(1 - 0.5 + Math.random() * (10 - 1 + 1));
var snakeY = Math.round(1 - 0.5 + Math.random() * (10 - 1 + 1));

var enemySnake;
var foodX, foodY, poisonX, poisonY;


example.onkeydown = function (e) {snake.setDirection(e.keyCode)}

function Point(x,y) {

    var self=this;


    this.draw=function(){
        ctx.fillStyle='black';
        ctx.fillRect(x*POINT_RADIUS, y*POINT_RADIUS, POINT_RADIUS,POINT_RADIUS)
    }


    this.getX=function() {
        return x;
    }

    this.getY=function() {
        return y;
    }
}


function Snake(x, y, length, direction) {
    this.snake=[];
    var directionSnake;
    var self = this;

    for (var i = 0; i < length; i++) {
        self.snake.push(new Point(x + i, y));
    }
    directionSnake = direction;


    this.isFood=function (food) {
        return (self.snake[self.snake.length-1].getX() == food.getX() && self.snake[self.snake.length-1].getY() == food.getY());
    }

    this.isPoison=function (poison) {
        return (self.snake[self.snake.length-1].getX() == poison.getX() && self.snake[self.snake.length-1].getY() == poison.getY());
    }

    this.move=function() {
        ctx.clearRect(0,0,example.width,example.height);
        var x = self.snake[self.snake.length-1].getX();
        var y = self.snake[self.snake.length-1].getY();

        if (directionSnake == RIGHT) x++;
        if (directionSnake == LEFT) x--;
        if (directionSnake == UP) y--;
        if (directionSnake == DOWN) y++;

        if (x > FIELD_WIDTH - 1) x = 0;
        if (x < 0) x = FIELD_WIDTH - 1;
        if (y > FIELD_HEIGHT - 1) y = 0;
        if (y < 0) y = FIELD_HEIGHT - 1;

        if(self.isInsideSnake(x,y) || self.isInsideEnemySnake(x, y, enemySnake)){
            clearInterval(gameOn);
            window.gameOver=true;
        }

        self.snake.push(new Point(x, y));
        self.paint();

        var packet = [];
        for (var i = 0; i < self.snake.length ; i++) {
            var o = {};
            o.x = self.snake[i].getX();
            o.y = self.snake[i].getY();
            packet.push(o);
        }
        socket.emit('move', packet);
        packet.length = 0;
        //self.snake.shift();
        // console.log(self.snake);

        if( self.isFood(food)){
            food.eat();
            score='Score: '+self.snake.length;
            document.getElementById("div0").textContent=score;
        }
        else{
            self.snake.shift();
        }

        if(self.isPoison(poison)){
            clearInterval(gameOn);
            window.gameOver=true;
        }
    }

    this.paint=function () {
        for (var i = 0; i < self.snake.length ; i++)
            self.snake[i].draw();
    }

    this.setDirection=function (direction) {
        if (direction >= LEFT && direction <= DOWN) {
            if (Math.abs(directionSnake - direction) != 2) directionSnake = direction;
        }
    }

    this.isInsideSnake=function (x,y){
        for (var i = 0; i < self.snake.length ; i++){
            if (self.snake[i].getX() == x && self.snake[i].getY() == y) return true;
        }
        return false;
    }

    this.isInsideEnemySnake = function (x, y, enemyCoords) {
        if(enemyCoords) {
            for(var i = 0; i < enemyCoords.length; i++) {
                if (enemyCoords[i].x == x && enemyCoords[i].y == y) return true;
            }
        }

        return false;
    }
}

function Food() {

    var self=this;


    self.x=-1;
    self.y=-1;

    console.log(self.x);



    this.eat=function () {
        socket.emit('foodEaten');
    }


    this.draw=function(){
        ctx.fillStyle='green';
        ctx.fillRect(self.x*POINT_RADIUS, self.y*POINT_RADIUS, POINT_RADIUS,POINT_RADIUS)
    }


    this.next=function () {
        var x, y;

        if(foodX && foodY){

            self.x=foodX;
            self.y=foodY;
            poison.next();
        }
        self.draw();
        poison.draw();
    }

    this.getX=function() {
        return self.x;
    }

    this.getY=function() {
        return self.y;
    }
}

function Poison() {
    this.x=-1;
    this.y=-1;
    var self=this;

    this.eat=function () {
        self.x=-1;
        self.y=-1;
    }

    this.isEaten=function () {
        return self.getX() == -1;
    }
    this.draw=function(){
        ctx.fillStyle='red';
        ctx.fillRect(self.x*POINT_RADIUS, self.y*POINT_RADIUS, POINT_RADIUS,POINT_RADIUS)
    }


    this.next=function () {
        self.x=poisonX;
        self.y=poisonY;
        self.draw();
    }

    this.getX=function() {
        return self.x;
    }

    this.getY=function() {
        return self.y;
    }
}

function drawEnemy(exsnake){
    if(exsnake) {
        for (var i = 0; i < exsnake.length ; i++) {
            ctx.fillStyle='black';
            ctx.fillRect(exsnake[i].x*POINT_RADIUS, exsnake[i].y*POINT_RADIUS, POINT_RADIUS,POINT_RADIUS)
        }

    }

}


var snake = new Snake(snakeX,snakeY,START_SIZE,39);
var food = new Food();
var poison = new Poison();




var game=function () {
    snake.move();
    food.next();
    drawEnemy(enemySnake);
    if(gameOver){
        ctx.font = 'bold 200px sans-serif';
        ctx.strokeText("Game Over", 30, example.height/2);
        socket.emit('gameOver');
        //document.body.addEventListener( "click" , function() {location.reload()});
    }
}

var gameOn;

example.focus();
