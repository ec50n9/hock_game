// ==UserScript==
// @name        element miner
// @namespace   Violentmonkey Scripts
// @match       *
// @include     *
// @require     https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @grant       none
// @version     1.0
// @author      ec50n9
// @description 2022/4/11 20:00:18
// @license     MIT
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

// 游戏
class Game {

    constructor() {
        this.running = false;
        this.loopTime = 10;
        this.scenes = [];

        this.loop(this.scenes);
    }

    async loop() {
        setInterval(() => {
            if (!this.running)
                return;
            this.scenes.forEach(scene => {
                scene.update();
                scene.draw();
            });
        }, this.loopTime);
    }

    start() { this.running = true; }

    pause() { this.running = false; }
}

// 操作台
class Crane {
    constructor(left = 0, top = 0) {
        this.score = 0;
        this.position = { left, top };
        this.deg = -180;
        this.degStep = 0.5;

        this.element = $('<div></div>').css({
            'position': 'fixed',
            'left': `${this.position.left}px`,
            'top': `${this.position.top}px`,
            // 'transform': 'translate(-50%, -50%)',
            'width': '128px',
            'height': '128px',
            'background-image': 'url(https://s3.bmp.ovh/imgs/2022/04/13/ebbf40101c3c1038.png)',
            'background-size': '100% auto',
            'overflow': 'visible',
            'z-index': '997'
        });
        this.console_element = $('<img src="https://s3.bmp.ovh/imgs/2022/04/13/3cf047c6fc4f1a33.png"/>').css({
            position: 'absolute',
            bottom: '0',
            left: '20%',
            width: '60%',
        });
        this.rope_hock_container_element = $('<div></div>').css({
            'margin-top': '90%',
            'transform-origin': 'top center',
            'transform': `rotate(${this.deg}deg)`,
            'z-index': '999'
        });
        this.element.append(this.console_element);
        this.element.append(this.rope_hock_container_element);
        // 道具
        this.props = [];
        // 捕捉事件
        let onCatch = (captured) => {
            let scrollLeft = $(document).scrollLeft();
            let scrollTop = $(document).scrollTop();
            let tagName = captured.element[0].tagName.toLowerCase();
            // 炸弹
            if (tagName == 'img') {
                let left = captured.element.offset().left - scrollLeft + captured.element.width() / 2;
                let top = captured.element.offset().top - scrollTop + captured.element.height() / 2;
                let random = Math.random();
                let type;
                if (random > .7) {
                    type = 'bomb';
                } else if (random > .5) {
                    type = 'flower'
                } else if (random > .3) {
                    type = 'diamond';
                } else {
                    type = 'bomb';
                }
                let prop = new Prop(this.props, left, top, type);
                if (prop) {
                    captured.element.parent().prepend(prop.element);
                }
                this.props.push(prop);
            }
        }
        // 绳子和爪子
        this.hock = new Hock(onCatch);
        this.rope = new Rope(this.hock, 10);
        this.rope_hock_container_element
            .append(this.rope.element)
            .append(this.hock.element);
        // 点击事件
        let that = this;
        this.element.click(function () {
            if (that.rope.state == Rope.STATUS.toMax) {
                that.rope.hock.catch();
                that.rope.toMin();
            } else {
                that.rope.toMax();
            }
        });
    }

    addDeg(increment) {
        let tmp = this.deg + increment;
        if (tmp == 360) {
            this.deg = 0;
        } else if (tmp > 360) {
            this.deg = tmp % 360;
        } else if (tmp < 0) {
            this.deg = 360 + tmp % 360;
        } else {
            this.deg = tmp;
        }
    }

    update() {
        if (this.rope.state == Rope.STATUS.keepStatic) {
            this.addDeg(this.degStep);
        }

        this.rope.update();

        for (let i in this.props) {
            let prop = this.props[i];
            if (prop.element) {
                prop.update();
            } else {
                this.props.splice(i, 1);
            }
        }
    }

    draw() {
        this.element.css({
            'left': `${this.position.left}px`,
            'top': `${this.position.top}px`
        });
        this.rope_hock_container_element.css({
            'transform': `rotate(${this.deg}deg)`
        });

        this.rope.draw();

        this.props.forEach(prop => {
            prop.draw();
        });
    }
}

// 绳子
class Rope {
    static DEFAULT_STEP = 1;
    static DEFAULT_LEN = 50;
    static MIN_LEN = 0;
    static MAX_LEN = 1000;
    static STATUS = {
        toMax: 0,
        toMin: 1,
        toDefault: 2,
        keepStatic: 3
    };

    constructor(hock = null, width = 10, length = Rope.DEFAULT_LEN, step = Rope.DEFAULT_STEP) {
        this.element = $('<div></div>').css({
            'width': `${this.width}px`,
            'height': `${this.length}px`,
            'margin': '0 auto',
            'background-image': 'url(https://s3.bmp.ovh/imgs/2022/04/13/65f0a51cebe9be16.png)',
            'background-size': '100% auto',
            'background-repeat': 'no-repeat repeat'
        });
        this.state = Rope.STATUS.keepStatic;
        this.width = width;
        this.length = length;
        this.step = step;
        this.hock = hock;
    }

    toMax() {
        this.state = Rope.STATUS.toMax;
    }
    toMin() {
        this.state = Rope.STATUS.toMin;
    }
    toDefault() {
        this.state = Rope.STATUS.toDefault;
    }
    keepStatic() {
        this.state = Rope.STATUS.keepStatic;
    }

    update() {
        switch (this.state) {
            case Rope.STATUS.toMax:
                if (this.length < Rope.MAX_LEN) {
                    this.length += this.step;
                } else {
                    this.hock.catch();
                    this.toMin();
                }
                break;
            case Rope.STATUS.toMin:
                if (this.length > Rope.MIN_LEN) {
                    this.length -= this.step;
                } else {
                    this.hock.loosen();
                    this.toDefault();
                }
                break;
            case Rope.STATUS.toDefault:
                if (this.length > Rope.DEFAULT_LEN) {
                    this.length -= 1;
                } else if (this.length < Rope.DEFAULT_LEN) {
                    this.length += 1;
                } else {
                    this.keepStatic();
                }
                break;
            default:
                break;
        }

        this.hock.update();
    }

    draw() {
        this.element.css({
            'width': `${this.width}px`,
            'height': `${this.length}px`
        });

        this.hock.draw();
    }
}

// 抓手
class Hock {
    static SRC_OPEN = 'https://s3.bmp.ovh/imgs/2022/04/12/1c986b60d886b9dd.png';
    static SRC_CLOSE = 'https://s3.bmp.ovh/imgs/2022/04/12/fd3fdb4cf18eb9f2.png';

    constructor(onCatch = (captured) => { }) {
        // 图片
        this.src = Hock.SRC_OPEN;
        // 网页元素
        this.element = $('<img>')
            .css({
                'display': 'block',
                'width': '64px',
                'height': '64px',
                'margin': '0 auto',
                'margin-top': '-4px',
                'object-fit': 'contain'
            })
            .attr('src', this.src);
        // 被捕获元素
        this.captured = {
            element: null,
            diff_left: 0,
            diff_top: 0
        };
        this.onCatch = onCatch;
    }

    catch() {
        let scrollLeft = $(document).scrollLeft();
        let scrollTop = $(document).scrollTop();
        let x = this.element.offset().left - scrollLeft + this.element.width() / 2,
            y = this.element.offset().top - scrollTop + this.element.height() / 2;
        let elements = document.elementsFromPoint(x, y);
        if (elements.length > 2) {
            this.captured.element = $(elements[2]);
            let tagName = this.captured.element[0].tagName.toLowerCase();
            // 忽略html元素
            if (tagName == 'html' || tagName == 'body') {
                this.captured.element = null;
                return;
            }
            // 计算上和左的距离
            this.captured.diff_left = this.element.offset().left - this.captured.element.offset().left + scrollLeft;
            this.captured.diff_top = this.element.offset().top - this.captured.element.offset().top + scrollTop;
            // 初始化拖动元素
            this.captured.element.css({
                'position': 'fixed',
                'left': `${this.captured.element.offset().left - $(document).scrollLeft()}px`,
                'top': `${this.captured.element.offset().top - $(document).scrollTop()}px`,
                'width': `${this.captured.element.width()}px`,
                'height': `${this.captured.element.height()}px`,
                'z-index': '995'
            });
            this.onCatch(this.captured);
        }
    }

    loosen() {
        if (this.captured.element) {
            this.captured.element.remove();
            this.captured.element = null;
        }
    }

    update() {
        if (this.captured.element) {
            this.src = Hock.SRC_CLOSE;
        } else {
            this.src = Hock.SRC_OPEN;
        }
    }

    draw() {
        this.element.attr('src', this.src);
        if (this.captured.element) {
            this.captured.element.css({
                'left': `${this.element.offset().left - this.captured.diff_left}px`,
                'top': `${this.element.offset().top - this.captured.diff_top}px`
            });
        }
    }
}

class Prop {

    static WAGGLE_DEG = 15;
    static TYPES = {
        bomb: {
            id: 0,
            text: '💣',
            score: -100,
            boomText: '💥BOOM!!!'
        },
        flower: {
            id: 1,
            text: '🌹',
            score: 50,
            boomText: '❤️HEY!!!'
        },
        diamond: {
            id: 2,
            text: '💎',
            score: 100,
            boomText: '💰HOOO!!!!'
        }
    };

    constructor(props, left, top, type = 'flower') {
        this.props = props;
        this.type = Prop.TYPES[type];
        this.countDown = 200;
        this.size = 32;
        this.deg = 0;
        this.color = 'red';
        this.zIndex = 0;
        this.element = $(`<div>${this.type.text}</div>`).css({
            'position': 'fixed',
            'left': `${left}px`,
            'top': `${top}px`,
            'white-space': 'nowrap',
            'color': this.color,
            'font-size': `${this.size}px`,
            'transform': `translate(-50%, -50%) rotate(${this.deg}deg)`,
            'z-index': this.zIndex
        });
    }

    update() {
        if (this.countDown > 0) {
            this.countDown -= 1;
        } else if (this.countDown > -64) {
            this.size += 1;
            this.countDown -= 1;
        } else if (this.countDown == -64) {
            this.deg = Prop.WAGGLE_DEG;
            this.text = this.type.boomText;
            this.zIndex = 999;
            this.countDown -= 1;
        } else if (this.countDown > -96) {
            if (this.countDown % 8 == 0) {
                this.deg = -this.deg;
            }
            this.countDown -= 1;
        } else {
            this.element.remove();
            this.element = null;
        }
    }

    draw() {
        if (!this.element)
            return;
        this.element.text(this.text).css({
            'transform': `translate(-50%, -50%) rotate(${this.deg}deg)`,
            'color': this.color,
            'font-size': `${this.size}px`,
            'z-index': this.zIndex
        });
    }
}

let game = new Game();
let crane = new Crane();
$('body').append(crane.element);
game.scenes.push(crane);
game.start();