function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createElement(tagName, className = "") {
    const element = document.createElement(tagName);
    element.className = className;
    return element;
}

class AudioEngine {
    constructor(audioId, audioSource, audioVolume = 1, audioLooped = false) {
        this.element = createElement("audio")
        this.element.setAttribute("id", audioId)
        this.element.setAttribute("src", audioSource)
        this.element.setAttribute("volume", audioVolume)
        audioLooped ? this.element.setAttribute("loop", "") : null;

        this.play = () => {
            this.element.play()
        }

        this.stop = () => {
            this.element.pause()
            this.element.currentTime = 0
        }

        this.remove = () => {
            this.element.remove()
        }
    }
}

function setAudioSource(audioId, source) {
    document.getElementById(audioId).setAttribute("src", source);
}

function playAudio(audioId) {
    document.getElementById(audioId).play();
}

function stopAudio(audioId) {
    var audio = document.getElementById(audioId)
    audio.pause();
    audio.currentTime = 0;
}


class Barrier {
    constructor(reverse = false) {
        this.element = createElement("div", "barrier");
        const border = createElement("div", "border tube-color");
        const body = createElement("div", "body tube-color");

        this.element.appendChild(reverse ? body : border);
        this.element.appendChild(reverse ? border : body);

        this.setHeight = height => body.style.height = `${height}px`;
    }
}

class PairOfBarriers {
    constructor(height, opening, x) {
        this.element = createElement("div", "pair-of-barriers");

        this.superior = new Barrier(true);
        this.inferior = new Barrier();

        this.element.appendChild(this.superior.element);
        this.element.appendChild(this.inferior.element);

        this.chooseRandomOpening = () => {
            const heightS = Math.random() * (height - opening);
            const heightI = height - opening - heightS;
            this.superior.setHeight(heightS);
            this.inferior.setHeight(heightI);
        };

        this.getX = () => parseInt(this.element.style.left.split("px")[0]);
        this.setX = x => this.element.style.left = `${x}px`;
        this.getWidth = () => this.element.clientWidth;

        this.chooseRandomOpening();
        this.setX(x);
    }
}

class Barriers {
    constructor(numberOfBarriers, height, width, opening, space, notifierPoint) {
        this.pairs = [...Array(numberOfBarriers)].map(() => 0);;
        for (var i = 0; i < numberOfBarriers; i++) {
            this.pairs[i] = new PairOfBarriers(height, getRandomInt(200, opening), width + (space * i));
        }
        const displacement = 3;
        this.animate = () => {
            this.pairs.forEach(pair => {
                pair.setX(pair.getX() - displacement);
                if (pair.getX() < -pair.getWidth()) {
                    pair.setX(pair.getX() + space * this.pairs.length);
                    pair.chooseRandomOpening();
                }

                const middle = width / 2;
                const crossedMiddle = pair.getX() + displacement >= middle
                    && pair.getX() < middle;
                if (crossedMiddle) {
                    notifierPoint();
                }
            });
        };
    }
}

class Bird {
    constructor(gameAreaHeight) {
        this.jumpSound = new AudioEngine("jump-sound", "sounds/jump.wav", "0.6")
        this.hitSound = new AudioEngine("hit-sound", "sounds/hit.wav", "0.5")
        this.dieSound = new AudioEngine("die-sound", "sounds/die.wav", "0.5")

        this.element = createElement("img", "bird");
        this.element.src = "./images/flappy_duck.png";
        this.getY = () => parseInt(this.element.style.bottom.split("px")[0]);
        this.setY = y => this.element.style.bottom = `${y}px`;
        this.setRotation = r => this.element.style.transform = `rotate(${r}deg)`;

        let velocity = 0;
        let rotation = 0;

        document.addEventListener("keydown", event => {
            if (event.code === "Space") {
                this.jumpSound.play()
                velocity = 10;
                rotation = -20;
            }
        });

        this.animate = () => {
            const newY = this.getY() + velocity;
            const maximumHeight = gameAreaHeight - this.element.clientHeight;

            velocity -= 1;

            if (velocity < -8) {
                rotation = 20;
            }

            if (newY <= 0) {
                this.setY(0);
                velocity = 0;
            } else if (newY >= maximumHeight) {
                this.setY(maximumHeight);
                velocity = 0;
            } else {
                this.setY(newY);
            }

            this.setRotation(rotation);
        };

        this.setY(gameAreaHeight / 2);
    }
}

class Progress {
    constructor() {
        this.element = createElement("span", "progress");

        this.updatePoints = points => {
            this.element.innerHTML = points;
        };

        this.updatePoints(0);
    }
}

function isOverlapped(elementA, elementB) {
    const a = elementA.getBoundingClientRect()
    const b = elementB.getBoundingClientRect()

    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top
    return (horizontal && vertical)
}

function collided(bird, barriers) {
    let collided = false
    barriers.pairs.forEach(pairOfBarriers => {
        if (!collided) {
            const superior = pairOfBarriers.superior.element
            const inferior = pairOfBarriers.inferior.element
            collided = isOverlapped(bird.element, superior) || isOverlapped(bird.element, inferior)
        }
    })
    return collided
}

class Game {
    constructor() {
        const gameArea = document.querySelector("[wm-flappy]")
        var currentPopup = null


        this.clearGame = () => {
            gameArea.innerHTML = "";
        }

        this.popup = function (texts, buttonSettings) {
            const popup = createElement("div", "bor1 bgcolor3 center rounded-corners popup")
            popup.setAttribute("id", "popup")

            texts.forEach(item => {
                const text = createElement("h1")
                text.textContent = item
                popup.appendChild(text)
            })

            const button = createElement("button")
            button.textContent = buttonSettings[0]
            button.addEventListener("click", buttonSettings[1], false)
            popup.appendChild(button)

            const p = createElement("p")
            popup.appendChild(p)

            gameArea.appendChild(popup)
            return popup
        }

        // Start of game code
        this.clearGame()

        const mainMenuMusic = new AudioEngine("main-menu-music", "sounds/main_menu_music.wav", "0.6", true)
        const gameMusic = new AudioEngine("game-music", "sounds/game_music.wav", "0.9", true)
        const gameOverMusic = new AudioEngine("gameover-music", "sounds/gameover_music.wav", "0.6", true)
        const pointSound = new AudioEngine("point-sound", "sounds/point.wav", "0.3")

        gameArea.className = "normal-bgd center";

        let points = 0;
        const width = gameArea.clientWidth;
        const height = gameArea.clientHeight;

        const progress = new Progress();
        const barriers = new Barriers(99, height, width, 300, 400, () => {
            progress.updatePoints(++points)
            pointSound.play()
        });
        const bird = new Bird(height);

        gameArea.appendChild(bird.element);
        barriers.pairs.forEach(pair => gameArea.appendChild(pair.element));

        // End of game code

        this.start = () => {
            gameMusic.play()
            mainMenuMusic.stop()

            currentPopup ? currentPopup.remove() : null;
            gameArea.appendChild(progress.element);

            currentIntervalId = setInterval(() => {
                barriers.animate();
                bird.animate()

                if (collided(bird, barriers)) {
                    this.gameOver()
                }
            }, 20);
        };

        this.restart = () => {
            gameOverMusic.stop()
            clearInterval(currentIntervalId);
            game = new Game()
            game.start()
        }

        this.gameOver = () => {
            clearInterval(currentIntervalId);
            gameMusic.stop()
            bird.hitSound.play()

            setTimeout(() => {
                this.clearGame()
                bird.dieSound.play()

                gameOverMusic.play()
                
                currentPopup = this.popup(["Game Over", `Pontos: ${points}`], ["Jogar Denovo?", this.restart])
            }, 500);
        };

        this.showMainMenu = () => {
            mainMenuMusic.play()
            currentPopup = this.popup(["Flappy"], ["Jogar", this.start])
        }
    }
}

var currentIntervalId = null
var game = null