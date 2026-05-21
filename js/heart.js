var bg = new Image();
bg.src = "https://trandat812003.github.io/heart/assets/thi_tho.jpg";

var settings = {
    particles: {
        length: 500,
        duration: 2,
        velocity: 100,
        effect: -0.75,
        size: 30,
    },
};

/*
 * Point class
 */

var Point = (function () {

    function Point(x, y) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
    }

    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };

    Point.prototype.length = function (length) {

        if (typeof length == 'undefined')
            return Math.sqrt(this.x * this.x + this.y * this.y);

        this.normalize();

        this.x *= length;
        this.y *= length;

        return this;
    };

    Point.prototype.normalize = function () {

        var length = this.length();

        this.x /= length;
        this.y /= length;

        return this;
    };

    return Point;

})();

/*
 * Particle class
 */

var Particle = (function () {

    function Particle() {

        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    }

    Particle.prototype.initialize = function (x, y, dx, dy) {

        this.position.x = x;
        this.position.y = y;

        this.velocity.x = dx;
        this.velocity.y = dy;

        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;

        this.age = 0;
    };

    Particle.prototype.update = function (deltaTime) {

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;

        this.age += deltaTime;
    };

    Particle.prototype.draw = function (context, image, color) {

        function ease(t) {
            return (--t) * t * t + 1;
        }

        var size = image.width * ease(this.age / settings.particles.duration);

        context.globalAlpha = 1 - this.age / settings.particles.duration;

        context.save();

        context.filter = "hue-rotate(" + (color + this.age * 120) + "deg)";

        context.drawImage(
            image,
            this.position.x - size / 2,
            this.position.y - size / 2,
            size,
            size
        );

        context.restore();
    };

    return Particle;

})();

/*
 * ParticlePool class
 */

var ParticlePool = (function () {

    var particles,
        firstActive = 0,
        firstFree = 0,
        duration = settings.particles.duration;

    function ParticlePool(length) {

        particles = new Array(length);

        for (var i = 0; i < particles.length; i++)
            particles[i] = new Particle();
    }

    ParticlePool.prototype.add = function (x, y, dx, dy) {

        particles[firstFree].initialize(x, y, dx, dy);

        firstFree++;

        if (firstFree == particles.length) firstFree = 0;
        if (firstActive == firstFree) firstActive++;

        if (firstActive == particles.length) firstActive = 0;
    };

    ParticlePool.prototype.update = function (deltaTime) {

        var i;

        if (firstActive < firstFree) {

            for (i = firstActive; i < firstFree; i++)
                particles[i].update(deltaTime);
        }

        if (firstFree < firstActive) {

            for (i = firstActive; i < particles.length; i++)
                particles[i].update(deltaTime);

            for (i = 0; i < firstFree; i++)
                particles[i].update(deltaTime);
        }

        while (particles[firstActive].age >= duration && firstActive != firstFree) {

            firstActive++;

            if (firstActive == particles.length)
                firstActive = 0;
        }
    };

    ParticlePool.prototype.draw = function (context, image, color) {

        if (firstActive < firstFree) {

            for (i = firstActive; i < firstFree; i++)
                particles[i].draw(context, image, color);
        }

        if (firstFree < firstActive) {

            for (i = firstActive; i < particles.length; i++)
                particles[i].draw(context, image, color);

            for (i = 0; i < firstFree; i++)
                particles[i].draw(context, image, color);
        }
    };

    return ParticlePool;

})();

(function (canvas) {

    var context = canvas.getContext('2d'),
        particles = new ParticlePool(settings.particles.length),
        particleRate = settings.particles.length / settings.particles.duration,
        time;

    function pointOnHeart(t) {

        return new Point(
            160 * Math.pow(Math.sin(t), 3),

            130 * Math.cos(t)
            - 50 * Math.cos(2 * t)
            - 20 * Math.cos(3 * t)
            - 10 * Math.cos(4 * t)
            + 25
        );
    }

    var image = (function () {

        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');

        canvas.width = settings.particles.size;
        canvas.height = settings.particles.size;

        function to(t) {

            var point = pointOnHeart(t);

            point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;

            point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;

            return point;
        }

        context.beginPath();

        var t = -Math.PI;
        var point = to(t);

        context.moveTo(point.x, point.y);

        while (t < Math.PI) {

            t += 0.01;

            point = to(t);

            context.lineTo(point.x, point.y);
        }

        context.closePath();

        context.fillStyle = '#ea80b0';
        context.fill();

        var image = new Image();
        image.src = canvas.toDataURL();

        return image;

    })();

    function drawCover(img) {

        let cw = canvas.width;
        let ch = canvas.height;

        let iw = img.width;
        let ih = img.height;

        let scale = Math.min(cw / iw, ch / ih);

        let nw = iw * scale;
        let nh = ih * scale;

        let nx = (cw - nw) / 2;
        let ny = (ch - nh) / 2;

        context.drawImage(img, nx, ny, nw, nh);
    }

    var stars = [];

    function createStars() {

        stars = [];

        for (let i = 0; i < 500; i++) {

            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.8 + 0.3,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.002
            });
        }
    }

    function drawStars() {

        for (let i = 0; i < stars.length; i++) {

            let s = stars[i];

            context.beginPath();

            context.arc(s.x, s.y, s.r, 0, Math.PI * 2);

            context.fillStyle = "rgba(255,255,255," + s.alpha + ")";

            context.fill();

            s.alpha += s.speed;

            if (s.alpha >= 1 || s.alpha <= 0.1) {
                s.speed *= -1;
            }
        }
    }

    function render() {

        requestAnimationFrame(render);

        var newTime = new Date().getTime() / 1000,
            deltaTime = newTime - (time || newTime);

        time = newTime;

        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawStars();

        if (bg.complete) {

            context.save();

            context.globalAlpha = 0.45;
            context.filter = "blur(2px) brightness(0.7)";

            drawCover(bg);

            context.restore();
        }

        var amount = particleRate * deltaTime;

        for (var i = 0; i < amount; i++) {

            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());

            var dir = pos.clone().length(settings.particles.velocity);

            particles.add(
                canvas.width / 2 + pos.x,
                canvas.height / 2 - pos.y,
                dir.x,
                -dir.y
            );
        }

        particles.update(deltaTime);

        var hue = (newTime * 60) % 360;

        particles.draw(context, image, hue);
    }

    function onResize() {

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        createStars();
    }

    window.onresize = onResize;

    setTimeout(function () {

        onResize();

        render();

    }, 10);

    document.addEventListener("click", function () {

        const music = document.getElementById("bgMusic");

        music.play();

    }, { once: true });

    const music = document.getElementById("bgMusic");

    music.addEventListener("ended", function () {

        // chuyển sang trang khác
        window.location.href = "love.html";

    });

})(document.getElementById('pinkboard'));