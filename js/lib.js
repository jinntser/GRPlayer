(function () {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (fn) {
            setTimeout(fn, 1000 / 60);
        };
    }

    document.onselectstart = function () {
        return false;
    };

    // document.onkeydown = function (e) {
    //     e.preventDefault();
    // };

    GRPlayer = function (target, opts) {
        var player = this;
        this.playlist = opts.playlist ? opts.playlist : [];
        this.autoplay = opts.autoplay ? opts.autoplay : false;
        this.controls = opts.controls ? opts.controls : true;
        this.infobox = opts.infobox ? opts.infobox : true;
        this.random = opts.random ? opts.random : false;
        this.volume = opts.defaultVolume ? opts.defaultVolume : 1;
        this.playspeed = 1;
        this.currentPlay = 1;
        this.currentTime = 0;
        this.duration = 0;
        this.playing = false;
        this.readerArmLeave = false;

        var audio = document.createElement('audio'),
            axleCoord = {
                x: 0,
                y: 0
            }, currentAngle = 0, rotateAngle = 0, rotateAngleStart, angleTemp, rounds, maxAngle, anglePerS = 36;

        this.fns = {
            togglePlay: function () {
                if (!audio.paused) {
                    audio.pause();
                    player.playing = false;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="play-toggle"]').className = 'pause';
                    }
                } else {
                    audio.play();
                    player.playing = true;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="play-toggle"]').className = 'play';
                    }
                    if (player.infobox) {
                        setTimeout(function () {
                            document.querySelector(target + ' .player-info .info-title').innerHTML = player.playlist[player.currentPlay - 1].title + ' (' + Math.floor(audio.duration / 60) + ':' + ((audio.duration % 60) < 10 ? ('0' + Math.floor(audio.duration % 60)) : Math.floor(audio.duration % 60)) + ')';
                        }, 100);
                    }
                }
            },
            toggleLoop: function () {
                if (!audio.loop) {
                    audio.loop = true;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="loop"]').className = 'active';
                    }
                } else {
                    audio.loop = false;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="loop"]').className = '';
                    }
                }
            },
            toggleRandom: function () {
                if (!player.random) {
                    player.random = true;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="random"]').className = 'active';
                    }
                } else {
                    player.random = false;
                    if (player.controls) {
                        document.querySelector(target + ' .control-panel span[data-action="random"]').className = '';
                    }
                }
            },
            toggleSpeed: function (value) {
                audio.playbackRate = value ? value : player.playspeed;
            },
            next: function (value) {
                if (value) {
                    if (!opts.playlist[value - 1]) {
                        console.error('Invalid value!');
                        return;
                    }
                    player.currentPlay = value;
                } else {
                    if (player.random) {
                        var _random = Math.ceil(Math.random() * player.playlist.length);
                        while (_random == player.currentPlay) {
                            _random = Math.ceil(Math.random() * player.playlist.length);
                        }
                        player.currentPlay = _random;
                    } else {
                        if (player.currentPlay == player.playlist.length) {
                            player.currentPlay = 1;
                        } else {
                            player.currentPlay += 1;
                        }
                    }
                }
                audio.src = opts.playlist[player.currentPlay - 1].src;
                document.querySelector(target + ' .disc-label').style.backgroundImage = 'url("' + player.playlist[player.currentPlay - 1].thumbnail + '")';
                player.fns.togglePlay();
                if (player.controls) {
                    document.querySelector(target + ' .control-panel span[data-action="play-toggle"]').className = 'play';
                }
            },
            prev: function () {
                if (player.random) {
                    player.currentPlay = Math.round(Math.random() * player.playlist.length);
                } else {
                    if (player.currentPlay == 1) {
                        player.currentPlay = player.playlist.length;
                    } else {
                        player.currentPlay -= 1;
                    }
                }
                audio.src = opts.playlist[player.currentPlay - 1].src;
                document.querySelector(target + ' .disc-label').style.backgroundImage = 'url("' + player.playlist[player.currentPlay - 1].thumbnail + '")';
                player.fns.togglePlay();
                if (player.controls) {
                    document.querySelector(target + ' .control-panel span[data-action="play-toggle"]').className = 'play';
                }
            },
            volume: function (value) {
                if (value >= 0 && value <= 1) {
                    audio.volume = value;
                } else {
                    console.error('Invalid value!');
                }
                player.volume = value;
            }
        };

        function _init() {
            var disc = document.createElement('div');
            disc.className = 'disc-base';
            disc.innerHTML = '<div class="disc"><div class="disc-label"></div></div>';
            document.querySelector(target).appendChild(disc);
            if (player.infobox) {
                var info = document.createElement('div');
                info.className = 'player-info';
                info.innerHTML = '<div class="info-title"></div>' +
                    '<div class="info-time-current"></div>';
                document.querySelector(target).appendChild(info);
            }
            if (player.controls) {
                var Knob = function (target, callback) {
                    var maxAngle = 150,
                        minAngle = -150,
                        knob = this,
                        startPt = 0,
                        angleTemp;
                    this.context = target;
                    this.angle = 0;
                    this.value = target.dataset.value ? target.dataset.value : 0;
                    this.type = target.dataset.action ? target.dataset.action : null;
                    this.max = target.dataset.max ? target.dataset.max : 100;
                    this.min = target.dataset.min ? target.dataset.min : 0;
                    this.range = this.max - this.min;

                    function knob_init() {
                        knob.angle = ((knob.value - knob.range * 0.5) / knob.range) * (maxAngle - minAngle);
                        knob.update();
                        if ('createTouches' in document) {
                            target.addEventListener('touchstart', ampRotateStart);
                        } else {
                            target.addEventListener('mousedown', ampRotateStart);
                        }
                    }

                    knob_init();

                    function ampRotateStart(e) {
                        if (knob.type == null) {
                            return;
                        }
                        startPt = e.pageY;
                        angleTemp = knob.angle;
                        if ('createTouches' in document) {
                            document.addEventListener('touchmove', ampRotating, false);
                            document.addEventListener('touchend', ampRotateEnd, false);
                        } else {
                            document.addEventListener('mousemove', ampRotating, false);
                            document.addEventListener('mouseup', ampRotateEnd, false);
                        }
                    }

                    // 功能做在rotating
                    function ampRotating(e) {
                        knob.angle = (startPt - e.pageY + angleTemp > maxAngle) ? maxAngle : (startPt - e.pageY + angleTemp < minAngle) ? minAngle : (startPt - e.pageY + angleTemp);
                        knob.value = ((knob.angle + 0.5 * (maxAngle - minAngle)) / (maxAngle - minAngle)) * knob.range;
                        knob.update();
                        if (callback && typeof callback == 'function') {
                            callback(knob.value);
                        }
                        // document.getElementById('debug').innerHTML = knob.value;
                    }

                    function ampRotateEnd() {
                        // console.log(knob.type + ' value changed to: ' + knob.value);
                        if ('createTouches' in document) {
                            document.removeEventListener('touchmove', ampRotating, false);
                            document.removeEventListener('touchend', ampRotateEnd, false);
                        } else {
                            document.removeEventListener('mousemove', ampRotating, false);
                            document.removeEventListener('mouseup', ampRotateEnd, false);
                        }
                    }
                };

                Knob.prototype.update = function () {
                    this.context.style.transform = 'rotate(' + this.angle + 'deg)';
                };

                function controls(target) {
                    var action = target.dataset.action;
                    switch (action) {
                        case 'play-toggle':
                            player.fns.togglePlay(target);
                            break;
                        case 'next':
                            player.fns.next();
                            break;
                        case 'prev':
                            player.fns.prev();
                            break;
                        case 'loop':
                            player.fns.toggleLoop(target);
                            break;
                        case 'random':
                            player.fns.toggleRandom(target);
                            break;
                        case 'play-speed':
                            player.fns.toggleSpeed(target.dataset.value);
                            target.className = 'active';
                            for (var s in ctrls) {
                                if (!isNaN(s)) {
                                    if (ctrls[s].dataset.action == 'play-speed') {
                                        if (ctrls[s].dataset.value && ctrls[s].dataset.value != target.dataset.value) {
                                            ctrls[s].className = '';
                                        }
                                    }
                                }
                            }
                            break;
                    }
                }

                var ctrlPanel = document.createElement('div');
                ctrlPanel.className = 'control-panel';
                ctrlPanel.innerHTML = '<ul>' +
                    '<li><span data-action="prev"><i class="fa fa-fast-backward"></i></span></li>' +
                    '<li><span data-action="play-toggle"><i class="fa fa-play"></i><i class="fa fa-pause"></i></span></li>' +
                    '<li><span data-action="next"><i class="fa fa-fast-forward"></i></span></li>' +
                    '<li><span data-action="loop"><i class="fa fa-undo"></i></span></li>' +
                    '<li><span data-action="random"><i class="fa fa-random"></i></span></li>' +
                    '<li><span data-action="play-speed" data-value="0.5">0.5x</span></li>' +
                    '<li><span data-action="play-speed" data-value="1" class="active">1x</span></li>' +
                    '<li><span data-action="play-speed" data-value="2">2x</span></li>' +
                    '<li><span data-action="play-speed" data-value="3">3x</span></li>' +
                    '</ul>';
                document.querySelector(target).appendChild(ctrlPanel);
                var ctrls = document.querySelectorAll(target + ' .control-panel span');
                for (var s in ctrls) {
                    if (!isNaN(s)) {
                        ctrls[s].onclick = function (e) {
                            controls(this)
                        }
                    }
                }
                var ampPanel = document.createElement('div');
                ampPanel.className = 'amp';
                ampPanel.innerHTML = '<div class="knob-wrap eq-low">' +
                    '<div class="knob knob-sm"></div>' +
                    '<div class="knob-label">LOW</div>' +
                    '</div>' +
                    '<div class="knob-wrap eq-high">' +
                    '<div class="knob knob-sm"></div>' +
                    '<div class="knob-label">HIGH</div>' +
                    '</div>' +
                    '<div class="knob-wrap volume">' +
                    '<div class="knob knob-lg" data-action="volume" data-max="1" data-min="0" data-suffix="%" data-value="1"></div>' +
                    '<div class="knob-label">VOLUME</div>' +
                    '</div>';
                document.querySelector(target).appendChild(ampPanel);
                var amps = [],
                    knobs = document.querySelectorAll(target + ' .amp .knob'),
                    ampFNS = {
                        volume: function (value) {
                            player.fns.volume(value);
                        }
                    };
                for (var s in knobs) {
                    if (!isNaN(s)) {
                        amps[s] = new Knob(knobs[s], (knobs[s].dataset.action ? ampFNS[knobs[s].dataset.action] : false));
                    }
                }
                var readerAxle = document.createElement('div');
                readerAxle.className = 'reader-axle';
                readerAxle.innerHTML = '<div class="reader-arm"><div class="reader-reader">ϾϿ<br>ϾϿ<br>ϾϿ</div></div>';
                document.querySelector(target).appendChild(readerAxle);
                var readerReader = document.querySelector(target + ' .reader-reader'),
                    readerArm = document.querySelector(target + ' .reader-arm');
                if ('createTouches' in document) {
                    readerReader.addEventListener('touchstart', readerArmUp);
                } else {
                    readerReader.addEventListener('mousedown', readerArmUp);
                }

                function readerArmUp() {
                    audio.muted = true;
                    readerArm.style.transform = 'rotateX(12deg)';
                    if ('createTouches' in document) {
                        document.addEventListener('touchmove', readerArmMove);
                        document.addEventListener('touchend', readerArmDown);
                    } else {
                        document.addEventListener('mousemove', readerArmMove);
                        document.addEventListener('mouseup', readerArmDown);
                    }
                }

                function readerArmMove() {
                }

                function readerArmDown() {
                    audio.muted = false;
                    readerArm.style.transform = 'rotateX(0deg)';
                    if ('createTouches' in document) {
                        document.removeEventListener('touchmove', readerArmMove);
                        document.removeEventListener('touchend', readerArmDown);
                    } else {
                        document.removeEventListener('mousemove', readerArmMove);
                        document.removeEventListener('mouseup', readerArmDown);
                    }
                }
            }
            if (opts.playlist[0]) {
                audio.src = opts.playlist[0].src;
                document.querySelector(target + ' .disc-label').style.backgroundImage = 'url("' + player.playlist[0].thumbnail + '")';
            }
            console.log(audio)
            audio.oncanplay = function () {
                player.duration = audio.duration;
                maxAngle = player.duration * anglePerS * (Math.PI / 180);
            };
            audio.onended = function () {
                if (player.controls && !player.loop && player.currentPlay == player.playlist.length) {
                    document.querySelector(target + ' .control-panel span[data-action="play-toggle"]').className = 'pause';
                    return;
                }
                if (player.loop) {
                    return;
                }
                player.fns.next();
            };
            audio.onerror = function () {
                console.error('Audio source may be invalid or deleted.');
                setTimeout(function () {
                    player.fns.next();
                }, 3000)
            };

            if (player.autoplay) {
                player.fns.togglePlay();
            }
        }

        _init();

        document.querySelector(target + ' .disc').onmousedown = function (e) {
            if (axleCoord.x == 0 && axleCoord.y == 0) {
                axleCoord = {
                    x: this.offsetLeft + (this.offsetWidth / 2),
                    y: this.offsetTop + (this.offsetHeight / 2)
                };
            }
            var dis = {
                x: e.pageX - axleCoord.x,
                y: e.pageY - axleCoord.y
            };

            rotateAngleStart = getCurrentAngle(dis.x, dis.y, Math.sqrt(dis.x * dis.x + dis.y * dis.y));
            rounds = 0;
            angleTemp = 0;
            currentAngle = audio.currentTime * anglePerS * (Math.PI / 180);
            if (!audio.paused) {
                audio.pause();
            }

            document.addEventListener('mousemove', discSpin, false);
            document.addEventListener('mouseup', removeSpinEvent, false);
        };

        function discSpin(e) {
            var dis = {
                x: e.pageX - axleCoord.x,
                y: e.pageY - axleCoord.y
            };

            rotateAngle = getCurrentAngle(dis.x, dis.y, Math.sqrt(dis.x * dis.x + dis.y * dis.y));
            if (!isNaN(rotateAngle) && rotateAngle !== null) {
                rotateAngle += currentAngle - rotateAngleStart + Math.PI * rounds * 2;
                if (rotateAngle - angleTemp > 0.5 * Math.PI && angleTemp != 0) {
                    rounds -= 1;
                    rotateAngle -= (Math.Pi * 2);
                } else if (rotateAngle - angleTemp < -0.5 * Math.PI && angleTemp != 0) {
                    rounds += 1;
                    rotateAngle += (Math.Pi * 2);
                }
                if (rotateAngle < 0) {
                    rotateAngle = 0;
                } else if (rotateAngle > maxAngle) {
                    rotateAngle = maxAngle;
                }
                angleTemp = rotateAngle;

                // document.getElementById('debug').innerHTML = 'rotate angle: ' + (180 * rotateAngle / Math.PI);
                document.querySelector(target + ' .disc').style.transform = 'rotate(' + (180 * rotateAngle / Math.PI) + 'deg)';
                if (!isNaN(rotateAngle)) {
                    audio.currentTime = Math.floor((180 * rotateAngle / Math.PI) * 1000) / (anglePerS * 1000);
                }
            } else {
                console.error('oops! something\'s wrong..')
            }
        }

        function getCurrentAngle(disX, disY, dis) {
            if (disX / dis > 0.7) { //右1/4
                return (Math.asin(disY / dis) + 0.5 * Math.PI);
            } else if (disX / dis < -0.7) { //左1/4
                return (-1 * Math.asin(disY / dis) + 1.5 * Math.PI);
            } else {
                if (disY > 0) { //下1/4
                    return (-1 * Math.asin(disX / dis) + Math.PI);
                } else if (disY < 0) { //上1/4
                    return Math.asin(disX / dis);
                } else { //exception: 中心點
                    return null;
                }
            }
        }

        function removeSpinEvent() {
            document.removeEventListener('mousemove', discSpin, false);
            document.removeEventListener('mouseup', removeSpinEvent, false);
            currentAngle = angleTemp;
            if (audio.paused) {
                audio.play();
            }
            return false;
        }

        var getCurrentTime = function () {
            player.currentTime = audio.currentTime;
            document.querySelector(target + ' .disc').style.transform = 'rotate(' + (anglePerS * player.currentTime) + 'deg)';
            if (!player.readerArmLeave) {
                //reader角度為5-35度
                document.querySelector(target + ' .reader-axle').style.transform = 'rotate(' + (35 - (player.currentTime / player.duration) * 30) + 'deg)';
            }
            if (player.infobox) {
                document.querySelector(target + ' .player-info .info-time-current').innerHTML = Math.floor(player.currentTime / 60) + ':' + ((player.currentTime % 60) < 10 ? ('0' + (Math.floor((player.currentTime % 60) * 1000) / 1000)) : (Math.floor((player.currentTime % 60) * 1000) / 1000));
            }
            requestAnimationFrame(getCurrentTime);
        };
        requestAnimationFrame(getCurrentTime);
    };

    GRPlayer.prototype = {
        togglePlay: function () {
            this.fns.togglePlay();
        },
        toggleLoop: function () {
            this.fns.toggleLoop();
        },
        toggleRandom: function () {
            this.fns.toggleRandom();
        },
        toggleSpeed: function (value) {
            if (!value) {
                return this.playspeed;
            } else {
                this.fns.toggleSpeed(value);
            }
        },
        next: function (value) {
            this.fns.next(value);
        },
        prev: function () {
            this.fns.prev();
        }
    };
})();