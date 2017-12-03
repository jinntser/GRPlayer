(function () {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (fn) {
            setTimeout(fn, 1000 / 60);
        };
    }
})();

// $(function () {
    var player = document.createElement('audio');
    player.src = 'files/Avicii-AddictedTo%20You.mp3';
    player.play();

    var axleCoord = {
        x: 0,
        y: 0
    }, currentAngle = 0, rotateAngle = 0, rotateAngleStart, angleTemp, rounds, maxAngle, anglePerS = 36;
    document.querySelector('.disc').onmousedown = function (e) {
        if (axleCoord.x == 0 && axleCoord.y == 0) {
            axleCoord = {
                x: this.offsetLeft + (this.offsetWidth / 2),
                y: this.offsetTop + (this.offsetHeight / 2)
            };
        }
        var dis = {
            x: e.clientX - axleCoord.x,
            y: e.clientY - axleCoord.y
        };

        rotateAngleStart = getCurrentAngle(dis.x, dis.y, Math.sqrt(dis.x * dis.x + dis.y * dis.y));
        rounds = 0;
        angleTemp = 0;
        currentAngle = player.currentTime * anglePerS * (Math.PI / 180);
        if (!player.paused) {
            player.pause();
        }

        document.addEventListener('mousemove', discSpin, false);
        document.addEventListener('mouseup', removeSpinEvent, false);
    };

    function discSpin(e) {
        var dis = {
            x: e.clientX - axleCoord.x,
            y: e.clientY - axleCoord.y
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
            document.querySelector('.disc').style.transform = 'rotate(' + (180 * rotateAngle / Math.PI) + 'deg)';
            if (!isNaN(rotateAngle)) {
                player.currentTime = Math.floor((180 * rotateAngle / Math.PI) * 1000) / (anglePerS * 1000);
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
        if (player.paused) {
            player.play();
        }
        return false;
    }

    document.onkeydown = function (e) {
        currentAngle = player.currentTime * anglePerS * (Math.PI / 180);
        if (e.keyCode == 39) {
            currentAngle += (Math.PI / anglePerS);
        } else if (e.keyCode == 37) {
            currentAngle -= (Math.PI / anglePerS);
        } else if (e.keyCode == 32) {
            e.preventDefault();
            if (!player.paused) {
                player.pause();
            } else {
                player.play();
            }
        } else {
            return;
        }
        // document.getElementById('debug').innerHTML = 'rotate angle: ' + (180 * currentAngle / Math.PI);
        document.querySelector('.disc').style.transform = 'rotate(' + (180 * currentAngle / Math.PI) + 'deg)';
        player.currentTime = (currentAngle * 180 / Math.PI) / anglePerS;
    };

    var getCurrentTime = function () {
        document.querySelector('.disc').style.transform = 'rotate(' + (anglePerS * player.currentTime) + 'deg)';
        requestAnimationFrame(getCurrentTime);
    };
    requestAnimationFrame(getCurrentTime);

    player.onload = function () {
        maxAngle = player.duration * anglePerS * (Math.PI / 180);
    };

    var ctrls = document.querySelectorAll('.control-panel button');
    for (var s in ctrls) {
        if (!isNaN(s)) {
            ctrls[s].onclick = function () {
                controls(this)
            }
        }
    }

    function controls(target) {
        var action = target.dataset.action;
        switch (action) {
            case 'play-toggle':
                if (!player.paused) {
                    player.pause();
                    target.className = 'play';
                } else {
                    player.play();
                    target.className = 'pause';
                }
                break;
            case 'loop':
                if (!player.loop) {
                    player.loop = true;
                    target.className = 'active';
                } else {
                    player.loop = false;
                    target.className = '';
                }
                break;
            case 'play-speed':
                player.playbackRate = target.dataset.value;
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
// });
