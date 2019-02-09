//key codes
var LEFT = 37;
var RIGHT = 39;
var UP = 38;
var DOWN = 40;
//size variables
var POINT_RADIUS = 40;
var FIELD_WIDTH = 30;
var FIELD_HEIGHT = 20;
var START_SIZE = 4;
//other variables
var score;
var gameOver = false;
var victory = false;
var leave = false;
var gameOn;
var enemySnake;
var foodX, foodY, poisonX, poisonY;


const gameField = document.getElementById("gameField"),
    ctx = gameField.getContext('2d');

gameField.width = FIELD_WIDTH * POINT_RADIUS;
gameField.height = FIELD_HEIGHT * POINT_RADIUS;

ctx.font = 'bold 100px sans-serif';
ctx.strokeText("Waiting for player 2", 130, gameField.height / 2);

gameField.onkeydown = function (e) {
    snake.setDirection(e.keyCode)
}

function Point(x, y) {

    this.draw = function () {
        ctx.fillStyle = 'black';
        ctx.fillRect(x * POINT_RADIUS, y * POINT_RADIUS, POINT_RADIUS, POINT_RADIUS)
    }

    this.getX = function () {
        return x;
    }

    this.getY = function () {
        return y;
    }
}

function Snake(x, y, length, direction) {
    this.snake = [];
    var directionSnake;
    var self = this;

    for (let i = 0; i < length; i++) {
        self.snake.push(new Point(x + i, y));
    }
    directionSnake = direction;

    this.getSize = function () {
        return this.snake.length;
    }

    this.isFood = function (food) {
        return (self.snake[self.snake.length - 1].getX() == food.getX() && self.snake[self.snake.length - 1].getY() == food.getY());
    }

    this.isPoison = function (poison) {
        return (self.snake[self.snake.length - 1].getX() == poison.getX() && self.snake[self.snake.length - 1].getY() == poison.getY());
    }

    this.move = function () {
        ctx.clearRect(0, 0, gameField.width, gameField.height);
        var x = self.snake[self.snake.length - 1].getX();
        var y = self.snake[self.snake.length - 1].getY();

        if (directionSnake == RIGHT) x++;
        if (directionSnake == LEFT) x--;
        if (directionSnake == UP) y--;
        if (directionSnake == DOWN) y++;

        if (x > FIELD_WIDTH - 1) x = 0;
        if (x < 0) x = FIELD_WIDTH - 1;
        if (y > FIELD_HEIGHT - 1) y = 0;
        if (y < 0) y = FIELD_HEIGHT - 1;

        if (self.isInsideSnake(x, y) || self.isInsideEnemySnake(x, y, enemySnake)) {
            clearInterval(gameOn);
            window.gameOver = true;
        }

        self.snake.push(new Point(x, y));
        self.paint();

        var packet = [];
        for (var i = 0; i < self.snake.length; i++) {
            var o = {};
            o.x = self.snake[i].getX();
            o.y = self.snake[i].getY();
            packet.push(o);
        }
        socket.emit('move', packet);
        packet.length = 0;

        if (self.isFood(food)) {
            food.eat();
            score = 'Score: ' + self.snake.length;
            document.getElementById("gameScore").textContent = score;
        }
        else {
            self.snake.shift();
        }

        if (self.isPoison(poison)) {
            clearInterval(gameOn);
            window.gameOver = true;
        }
    }

    this.paint = function () {
        for (var i = 0; i < self.snake.length; i++)
            self.snake[i].draw();
    }

    this.setDirection = function (direction) {
        if (direction >= LEFT && direction <= DOWN) {
            if (Math.abs(directionSnake - direction) != 2) directionSnake = direction;
        }
    }

    this.isInsideSnake = function (x, y) {
        for (var i = 0; i < self.snake.length; i++) {
            if (self.snake[i].getX() == x && self.snake[i].getY() == y) return true;
        }
        return false;
    }

    this.isInsideEnemySnake = function (x, y, enemyCoords) {
        if (enemyCoords) {
            for (var i = 0; i < enemyCoords.length; i++) {
                if (enemyCoords[i].x == x && enemyCoords[i].y == y) return true;
            }
        }

        return false;
    }
}

function Food() {
    var self = this;

    //initial food position
    self.x = -1;
    self.y = -1;

    this.eat = function () {
        socket.emit('foodEaten');
    }

    this.draw = function () {
        ctx.fillStyle = 'green';
        ctx.fillRect(self.x * POINT_RADIUS, self.y * POINT_RADIUS, POINT_RADIUS, POINT_RADIUS)
    }

    this.next = function () {
        var x, y;

        if (foodX && foodY) {

            self.x = foodX;
            self.y = foodY;
            poison.next();
        }
        self.draw();
        poison.draw();
    }

    this.getX = function () {
        return self.x;
    }

    this.getY = function () {
        return self.y;
    }
}

function Poison() {
    var self = this;

    //initial poison position
    this.x = -1;
    this.y = -1;

    this.draw = function () {
        ctx.fillStyle = 'red';
        ctx.fillRect(self.x * POINT_RADIUS, self.y * POINT_RADIUS, POINT_RADIUS, POINT_RADIUS)
    }

    this.next = function () {
        self.x = poisonX;
        self.y = poisonY;
        self.draw();
    }

    this.getX = function () {
        return self.x;
    }

    this.getY = function () {
        return self.y;
    }
}

function drawEnemy(exsnake) {
    if (exsnake) {
        for (var i = 0; i < exsnake.length; i++) {
            ctx.fillStyle = 'black';
            ctx.fillRect(exsnake[i].x * POINT_RADIUS, exsnake[i].y * POINT_RADIUS, POINT_RADIUS, POINT_RADIUS);
        }
    }
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var timerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? `0${minutes}` : minutes;
        seconds = seconds < 10 ? `0${seconds}` : seconds;

        display.textContent = `Your time is running out ${minutes}:${seconds}`;

        if (--timer < 0) {
            if (enemySnake.length > snake.getSize()) {
                gameOver = true;
                socket.emit('gameOver');
            }
            display.textContent = '';
            clearInterval(timerInterval);
        }
        if (victory || gameOver || leave) {
            display.textContent = '';
            clearInterval(timerInterval);
            document.body.addEventListener("click", function () {
                location.reload()
            });
        }
    }, 1000);
}


var snake = new Snake(-1, -1, 1, 39);
var food = new Food();
var poison = new Poison();

//main game cycle
var game = function () {
    snake.move();
    food.next();
    drawEnemy(enemySnake);
    if (gameOver) {
        ctx.font = 'bold 200px sans-serif';
        ctx.strokeText("Game Over", 30, gameField.height / 2);
        socket.emit('gameOver');
        clearInterval(gameOn)
    }
}
