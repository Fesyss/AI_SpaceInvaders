"use strict";
import mockedTrainingData from "./trainingData.js";

const messageRef = document.getElementById("message");

messageRef.textContent = `Net is training with ${mockedTrainingData.length} items...`;

console.log(messageRef.textContent);

const net = new brain.NeuralNetwork({
  inputSize: 6,
  inputRange: 1,
  hiddenLayers: [5, 5],
  outputSize: 2,
  // learningRate: 0.01,
  // decayRate: 0.999,
});
console.log(messageRef);

const LOCAL_STORAGE_TRAINING_DATA_KEY = "training-data";
const localTrainingData = JSON.parse(
  localStorage.getItem(LOCAL_STORAGE_TRAINING_DATA_KEY) || "[]"
);
let trainingData = localTrainingData || [];

const trainNet = () =>
  net.train(mockedTrainingData, {
    iterations: 50000,
    log: (stats) =>
      (messageRef.textContent = `Net is training with ${
      mockedTrainingData.length
      } items. Progress ${(stats.iterations / 10000) * 100}%`),
  });

trainNet();

messageRef.textContent = "";

// const diagram = document.getElementById("net-diagram");
// diagram.innerHTML = brain.utilities.toSVG(net);

function init() {
  // General
  var canvas, screen, gameSize, game;

  // Assets
  var invaderCanvas,
    invaderMultiplier,
    invaderSize = 20,
    initialOffsetInvader,
    invaderAttackRate,
    invaderSpeed,
    invaderSpawnDelay = 250;

  // Counter
  var i = 0,
    kills = 0,
    spawnDelayCounter = invaderSpawnDelay;

  var invaderDownTimer, netTimer, AIdecisionTimer;

  // Text
  var blocks = [
    [],
    [],
    [],
    [],
    [],
    [7,],
    // [7],
  ];

  // Game Controller
  // ---------------
  var Game = function () {
    this.level = -1;
    this.lost = false;

    this.player = new Player();
    this.invaders = [];
    this.invaderShots = [];

    const moveInvaders = () => {
      // function getRandomInt(max) {
      //   return Math.floor(Math.random() * max) + 1;
      // }

      // const randomValue = getRandomInt(3);
      // const randomBoolean = getRandomInt(2) === 1;

      // this.player.keyboarder.keyState[
      //   Object.values(his.player.keyboarder.keyState)[randomValue - 1]
      // ] = randomBoolean;

      updateTrainingData(trainingData);

      for (i = 0; i < game.invaders.length; i++) game.invaders[i].move();
    };

    if (invaderDownTimer === undefined) {
      invaderDownTimer = setInterval(moveInvaders, 1000 - this.level * 1.8);
    }

    const getNormalizedY = (y) => {
      return Math.min(y / gameSize.height, 1);
    };

    const getNormalizedX = (x) => {
      return Math.min(x / gameSize.width, 1);
    };

    const getCloserInvader = () => {
      const closerInvader = this.invaders.reduce((prev, curr) => {
        return Math.abs(curr.coordinates.x - this.player.coordinates.x) <
          Math.abs(prev.coordinates.x - this.player.coordinates.x)
          ? curr
          : prev;
      });
      return closerInvader;
    };

    const getCloserInvaderShot = () => {
      const closerInvaderShot = this.invaderShots.reduce((prev, curr) => {
        return Math.abs(curr.coordinates.x - this.player.coordinates.x) <
          Math.abs(prev.coordinates.x - this.player.coordinates.x)
          ? curr
          : prev;
      });
      return closerInvaderShot;
    };

    const getTupleToCloserInvader = () => {
      const closerInvader = getCloserInvader();
      return [
        getNormalizedX(Math.abs(closerInvader.coordinates.x - this.player.coordinates.x)),
        getNormalizedY(Math.abs(closerInvader.coordinates.y - this.player.coordinates.y)),
      ];
    };

    const getTupleToCloserInvaderShot = () => {
      const closerInvaderShot = getCloserInvaderShot();
      return [
        getNormalizedX(Math.abs(closerInvaderShot.coordinates.x - this.player.coordinates.x)),
        getNormalizedY(Math.abs(closerInvaderShot.coordinates.y - this.player.coordinates.y)),
      ];
    };

    const getTupleToPlayer = () => {
      return [
        getNormalizedX(this.player.coordinates.x),
        getNormalizedY(this.player.coordinates.y),
      ];
    };

    const getTrainingData = () => {
      const trainingData = {
        input: [],
        output: [],
      };

      trainingData.input = [
        ...getTupleToCloserInvader(),
        ...getTupleToCloserInvaderShot(),
        ...getTupleToPlayer(),
      ];

      const KEYS = this.player.keyboarder.KEYS;
      const isDown = this.player.keyboarder.isDown.bind(this.player.keyboarder);

      let positionFactor = 0;
      let shotFactor = 0;

      if (isDown(KEYS.LEFT)) {
        positionFactor = 0.66;
      }

      if (isDown(KEYS.RIGHT)) {
        positionFactor = 1;
      }

      if (isDown(KEYS.Space)) {
        shotFactor = 1;
      }

      trainingData.output = [positionFactor, shotFactor];

      return trainingData;
    };

    const updateTrainingData = () => {
      trainingData.push(getTrainingData());

      if (this.lost) {
        if (this.skipSaving) {
          return;
        }
        localStorage.setItem(
          LOCAL_STORAGE_TRAINING_DATA_KEY,
          JSON.stringify(trainingData.slice(0, -2))
        );
        this.skipSaving = true;
      }

      localStorage.setItem(LOCAL_STORAGE_TRAINING_DATA_KEY, JSON.stringify(trainingData));
    };

    const makeAIdecision = () => {
      const decision = net.run(getTrainingData().input);

      const KEYS = this.player.keyboarder.KEYS;
      const keyState = this.player.keyboarder.keyState;

      console.log(decision);

      if (decision[0] <= 0.33) {
        keyState[KEYS.LEFT] = false;
        keyState[KEYS.RIGHT] = false;
      }
      if (decision[0] >= 0.66) {
        keyState[KEYS.LEFT] = false;
        keyState[KEYS.RIGHT] = true;
      }
      if (decision[0] > 0.33 && decision[0] < 0.66) {
        keyState[KEYS.LEFT] = true;
        keyState[KEYS.RIGHT] = false;
      }

      if (decision[1] > 0.5) {
        keyState[KEYS.Space] = true;
      } else {
        keyState[KEYS.Space] = false;
      }
    };

    if (netTimer === undefined) {
      netTimer = setInterval(updateTrainingData, 1000);
    }

    if (AIdecisionTimer === undefined) {
      AIdecisionTimer = setInterval(makeAIdecision, 50);
    }
  };

  Game.prototype = {
    update: function () {
      // Next level
      if (game.invaders.length === 0) {
        spawnDelayCounter += 1;
        if (spawnDelayCounter < invaderSpawnDelay) return;

        this.level += 1;

        invaderAttackRate -= 0.004;
        invaderSpeed += 20;

        game.invaders = createInvaders();

        spawnDelayCounter = 0;
      }

      if (!this.lost) {
        // Collision
        game.player.projectile.forEach(function (projectile) {
          game.invaders.forEach(function (invader) {
            if (collides(projectile, invader)) {
              invader.destroy();
              projectile.active = false;
            }
          });
        });

        this.invaderShots.forEach(function (invaderShots) {
          if (collides(invaderShots, game.player)) {
            game.player.destroy();
          }
        });

        for (i = 0; i < game.invaders.length; i++) game.invaders[i].update();
      }

      // Don't stop player & projectiles.. they look nice
      game.player.update();
      for (i = 0; i < game.invaderShots.length; i++) game.invaderShots[i].update();

      this.invaders = game.invaders.filter(function (invader) {
        return invader.active;
      });
    },

    draw: function () {
      if (this.lost) {
        screen.fillStyle = "rgba(0, 0, 0, 0.03)";
        screen.fillRect(0, 0, gameSize.width, gameSize.height);

        screen.font = "55px Lucida Console";
        screen.textAlign = "center";
        screen.fillStyle = "white";
        screen.fillText("You lost", gameSize.width / 2, gameSize.height / 2);
        screen.font = "20px Lucida Console";
        screen.fillText("Points: " + kills, gameSize.width / 2, gameSize.height / 2 + 30);
      } else {
        screen.clearRect(0, 0, gameSize.width, gameSize.height);

        screen.font = "10px Lucida Console";
        screen.textAlign = "right";
        screen.fillText("Points: " + kills, gameSize.width, gameSize.height - 12);
      }

      screen.beginPath();

      var i;
      this.player.draw();
      if (!this.lost) for (i = 0; i < this.invaders.length; i++) this.invaders[i].draw();
      for (i = 0; i < this.invaderShots.length; i++) this.invaderShots[i].draw();

      screen.fill();
    },

    invadersBelow: function (invader) {
      return (
        this.invaders.filter(function (b) {
          return (
            Math.abs(invader.coordinates.x - b.coordinates.x) === 0 &&
            b.coordinates.y > invader.coordinates.y
          );
        }).length > 0
      );
    },
  };

  // Invaders
  // --------
  var Invader = function (coordinates) {
    this.active = true;
    this.coordinates = coordinates;
    this.size = {
      width: invaderSize,
      height: invaderSize,
    };

    this.patrolX = 0;
    this.speedX = invaderSpeed;
  };

  Invader.prototype = {
    update: function () {
      if (Math.random() > invaderAttackRate && !game.invadersBelow(this)) {
        var projectile = new Projectile(
          {
            x: this.coordinates.x + this.size.width / 2,
            y: this.coordinates.y + this.size.height - 5,
          },
          {
            x: 0,
            y: 2,
          }
        );
        game.invaderShots.push(projectile);
      }
    },
    draw: function () {
      if (this.active) screen.drawImage(invaderCanvas, this.coordinates.x, this.coordinates.y);
    },
    move: function () {
      if (this.patrolX < 0 || this.patrolX > 100) {
        this.speedX = -this.speedX;
        this.patrolX += this.speedX;
        this.coordinates.y += this.size.height;

        if (this.coordinates.y + this.size.height * 2 > gameSize.height) game.lost = true;
      } else {
        this.coordinates.x += this.speedX;
        this.patrolX += this.speedX;
      }
    },
    destroy: function () {
      this.active = false;
      kills += 1;
    },
  };

  // Player
  // ------
  var Player = function () {
    this.active = true;
    this.size = {
      width: 16,
      height: 8,
    };
    this.shooterHeat = -3;
    this.coordinates = {
      x: (gameSize.width / 2 - this.size.width / 2) | 0,
      y: gameSize.height - this.size.height * 2,
    };

    this.projectile = [];
    this.keyboarder = new KeyController();
  };

  Player.prototype = {
    update: function () {
      for (var i = 0; i < this.projectile.length; i++) this.projectile[i].update();

      this.projectile = this.projectile.filter(function (projectile) {
        return projectile.active;
      });

      if (!this.active) return;

      if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT) && this.coordinates.x > 0)
        this.coordinates.x -= 2;
      else if (
        this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT) &&
        this.coordinates.x < gameSize.width - this.size.width
      )
        this.coordinates.x += 2;

      if (this.keyboarder.isDown(this.keyboarder.KEYS.Space)) {
        this.shooterHeat += 1;
        if (this.shooterHeat < 0) {
          var projectile = new Projectile(
            {
              x: this.coordinates.x + this.size.width / 2 - 1,
              y: this.coordinates.y - 1,
            },
            {
              x: 0,
              y: -7,
            }
          );
          this.projectile.push(projectile);
        } else if (this.shooterHeat > 12) this.shooterHeat = -3;
      } else {
        this.shooterHeat = -3;
      }
    },
    draw: function () {
      if (this.active) {
        screen.rect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);
        screen.rect(this.coordinates.x - 2, this.coordinates.y + 2, 20, 6);
        screen.rect(this.coordinates.x + 6, this.coordinates.y - 4, 4, 4);
      }

      for (var i = 0; i < this.projectile.length; i++) this.projectile[i].draw();
    },
    destroy: function () {
      this.active = false;
      game.lost = true;
    },
  };

  // Projectile
  // ------
  var Projectile = function (coordinates, velocity) {
    this.active = true;
    this.coordinates = coordinates;
    this.size = {
      width: 3,
      height: 3,
    };
    this.velocity = velocity;
  };

  Projectile.prototype = {
    update: function () {
      this.coordinates.x += this.velocity.x;
      this.coordinates.y += this.velocity.y;

      if (this.coordinates.y > gameSize.height || this.coordinates.y < 0) this.active = false;
    },
    draw: function () {
      if (this.active)
        screen.rect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);
    },
  };

  // Keyboard input tracking
  // -----------------------
  var KeyController = function () {
    this.KEYS = {
      LEFT: 37,
      RIGHT: 39,
      Space: 32,
    };
    this.keyState = {};
    var keyCode = [37, 39, 32];

    var counter;

    function keydownHandler(e) {
      for (counter = 0; counter < keyCode.length; counter++)
        if (keyCode[counter] == e.keyCode) {
          this.keyState[e.keyCode] = true;
          e.preventDefault();
        }
    }
    function keyupHandler(e) {
      for (counter = 0; counter < keyCode.length; counter++)
        if (keyCode[counter] == e.keyCode) {
          this.keyState[e.keyCode] = false;
          e.preventDefault();
        }
    }

    window.addEventListener("keydown", keydownHandler.bind(this));

    window.addEventListener("keyup", keyupHandler.bind(this));

    this.isDown = function (keyCode) {
      return this.keyState[keyCode] === true;
    };
  };

  // Other functions
  // ---------------
  function collides(a, b) {
    return (
      a.coordinates.x < b.coordinates.x + b.size.width &&
      a.coordinates.x + a.size.width > b.coordinates.x &&
      a.coordinates.y < b.coordinates.y + b.size.height &&
      a.coordinates.y + a.size.height > b.coordinates.y
    );
  }

  function getPixelRow(rowRaw) {
    var textRow = [],
      placer = 0,
      row = Math.floor(rowRaw / invaderMultiplier);
    if (row >= blocks.length) return [];
    for (var i = 0; i < blocks[row].length; i++) {
      var tmpContent = blocks[row][i] * invaderMultiplier;
      for (var j = 0; j < invaderMultiplier; j++) textRow[placer + j] = tmpContent + j;
      placer += invaderMultiplier;
    }
    return textRow;
  }

  // Write Text
  // -----------
  function createInvaders() {
    var invaders = [];

    var i = blocks.length * invaderMultiplier;
    while (i--) {
      var j = getPixelRow(i);
      for (var k = 0; k < j.length; k++) {
        invaders.push(
          new Invader({
            x: j[k] * invaderSize,
            y: i * invaderSize,
          })
        );
      }
    }
    return invaders;
  }

  // Start game
  // ----------
  window.addEventListener("load", function () {
    var invaderAsset = new Image();
    invaderAsset.onload = function () {
      invaderCanvas = document.createElement("canvas");
      invaderCanvas.width = invaderSize;
      invaderCanvas.height = invaderSize;
      invaderCanvas.getContext("2d").drawImage(invaderAsset, 0, 0);

      // Game Creation
      canvas = document.getElementById("space-invaders");
      screen = canvas.getContext("2d");

      initGameStart();
      loop();
    };
    invaderAsset.src = "//stillh.art/project/spaceInvaders/invader.gif";
  });

  window.addEventListener("resize", function () {
    initGameStart();
  });
  document.getElementById("restart").addEventListener("click", function () {
    initGameStart();
  });

  function initGameStart() {
    if (window.innerWidth > 1200) {
      screen.canvas.width = 1200;
      screen.canvas.height = 500;
      gameSize = {
        width: 1200,
        height: 500,
      };
      invaderMultiplier = 3;
      initialOffsetInvader = 420;
    } else if (window.innerWidth > 800) {
      screen.canvas.width = 900;
      screen.canvas.height = 600;
      gameSize = {
        width: 900,
        height: 600,
      };
      invaderMultiplier = 2;
      initialOffsetInvader = 280;
    } else {
      screen.canvas.width = 600;
      screen.canvas.height = 300;
      gameSize = {
        width: 600,
        height: 300,
      };
      invaderMultiplier = 1;
      initialOffsetInvader = 140;
    }

    kills = 0;
    invaderAttackRate = 0.999;
    invaderSpeed = 20;
    spawnDelayCounter = invaderSpawnDelay;

    game = new Game();
  }

  function loop() {
    game.update();
    game.draw();

    requestAnimationFrame(loop);
  }
}

init();

const loadTrainingData = () => {
  const dataStr = JSON.stringify(trainingData);

  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const link = document.createElement("a");

  link.setAttribute("href", dataUri);
  link.setAttribute("download", "trainingData.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const clearTrainingData = () => {
  trainingData = [];
  localStorage.setItem(LOCAL_STORAGE_TRAINING_DATA_KEY, JSON.stringify([]));
};

const loadBtnRef = document.querySelector("#load-btn");
loadBtnRef.addEventListener("click", loadTrainingData);

const clearBtnRef = document.querySelector("#clear-data-btn");
clearBtnRef.addEventListener("click", clearTrainingData);
