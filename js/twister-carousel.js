// below is the plugin code
'use strict';

/*function $(elem) {
    return document.querySelector(elem);
}*/

function hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
}

function addClass(el, className) {
    if (el.classList) {
        el.classList.add(className);
    } else {
        el.className += ' ' + className;
    }
}

function removeClass(el, className) {
    if (el.classList) {
        el.classList.remove(className);
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

function $extendObj(_def, addons) {
    if (typeof addons !== "undefined") {
        for (var prop in _def) {
            if (addons[prop] != undefined) {
                _def[prop] = addons[prop];
            }
        }
    }
}

// begin carousel functions
function twister(options) {
    var _ = this;

    // default settings
    _.def = {
        element: 'carousel',
        interval: 1000,
        speed: 200,
        easing: 'ease-in-out',
        autoplay: false,
        swipe: true,
        autoHeight: true,
        loop: true,
        dots: true,
        peek: true,
        stagePadding: '40px',
        lazyLoad: true,
        arrows: true,
        arrowsColor: '',  // default | circle | fill
        arrowsStyle: '',  // default | red | grey | white
        responsiveClass: true,
        responsive:{
            0: {
                items: 1
            },
            768: {
                items: 3
            }
        },
        callbackSetting: function () {}
    }

    // logging the options for the carousel
    console.dir(_.def);
    $extendObj(_.def, options);

    _.element = document.getElementById(_.def.element);
    _.cards = _.element.children;
    _.count = _.cards.length;

    // add .card class to each of the carousel items
    for (var i = 0; i < _.count; i++) {
        addClass(_.cards[i], 'card');
        _.cards[i].setAttribute("aria-hidden", "true");
    }
    _.cards[0].setAttribute("aria-hidden", "false");

    _.init();
}

twister.prototype.init = function() {
    var _ = this;

    function on_resize(c, t) {
        onresize = function() {
            clearTimeout(t);
            t = setTimeout(c, 100);
        }
        return onresize;
    }

    // check the width of the element and the innerWindow
    _.carouselWidth = _.element.offsetWidth;
    _.viewportWidth = window.innerWidth;

    // update the width variables on the windwo resize
    window.addEventListener("resize", on_resize(function () {
        _.carouselWidth = _.element.offsetWidth;
        _.viewportWidth = window.innerWidth;

        console.log('[twister] carousel Width: '+_.carouselWidth);
        console.log('[twister] viewport Width: '+_.viewportWidth);
    }), false);

    // wrap the carousel inside a new container to make the carousel work correctly.
    var nowHTML = _.element.innerHTML;
    _.element.innerHTML = '<div class="carousel--inner">' + nowHTML + '</div>';

    // add the .twister class to the main container for styling.
    addClass(_.element, 'twister');
    // enable the aria atribute to keep the screen reader updated as the carousel updates
    _.element.setAttribute("aria-live", "polite");


    _.allSlides = 0;
    _.curSlide = 0;
    _.curLeft = 0;
    _.totalSlides = _.element.querySelectorAll('.card').length;

    _.sliderInner = _.element.querySelector('.carousel--inner');
    _.loadedCnt = 0;

    // clone the first and last cards for displaying with the peek setting.
    if(_.def.peek == true)
        _.clone(),
        _.sliderInner.style.left = '-100%',
        _.totalSlides = _.totalSlides + 2;

    _.curSlide++;
    _.allSlides = _.element.querySelectorAll('.card');

    // set the width of each card to a percentage of the full container based on how many cards there are.
    _.sliderInner.style.width = (_.totalSlides) * 100 + "%";
    for (var _i = 0; _i < _.totalSlides; _i++) {
        _.allSlides[_i].style.width = 100 / (_.totalSlides) + "%";
    }

    // add in the buttons for next and previous and initate them
    if(_.def.arrows == true)
        _.addArrows();

    // add in the dots navigation and initiate them
    if(_.def.dots == true)
        _.addDots(),
        _.direction = 'init',
        _.setDot();

    // setting up the swipe
    var xDown = '', xUp = '';
    function lock(e) {
        xDown = unify(e).clientX;
        //console.log('[twister] down: '+xDown);
    }

    function move(e) {
        xUp = unify(e).clientX;
        //console.log('[twister] up: '+xUp);

        if (xDown < xUp) {
            _.goPrev();
            console.log('[twister] swipe prev');
        } else if (xDown > xUp) {
            _.goNext();
            console.log('[twister] swipe next');
        }
    }

    function unify(e) {
        return e.changedTouches ? e.changedTouches[0] : e
    }

    _.element.addEventListener('mousedown', lock, false);
    _.element.addEventListener('touchstart', lock, false);
    _.element.addEventListener('mouseup', move, false);
    _.element.addEventListener('touchend', move, false);

    // creating the isMoving variable to add when animation is in process to keep from causing the buttons or slide events from happening multiple times and breaking the carosel
    _.isMoving = false;

    if(_.def.autoplay == true)
        _.autoPlay();
}

twister.prototype.clone = function() {
    var _ = this;

    addClass(_.element, 'peek');
    var cloneFirst = _.element.querySelectorAll('.card')[0].cloneNode(true);
    cloneFirst.setAttribute("aria-hidden", "true");
    _.sliderInner.appendChild(cloneFirst);

    var cloneLast = _.element.querySelectorAll('.card')[_.totalSlides - 1].cloneNode(true);
    cloneLast.setAttribute("aria-hidden", "true");
    _.sliderInner.insertBefore(cloneLast, _.sliderInner.firstChild);
}

twister.prototype.addArrows = function() {
    var _ = this;
    addClass(_.element, 'arrows');

    var prevBtn = document.createElement("button"),
        nextBtn = document.createElement("button");

    addClass(prevBtn, 'prevBtn');
    addClass(nextBtn, 'nextBtn');

    _.element.prepend(prevBtn);
    _.element.append(nextBtn);

    prevBtn.innerHTML = '<div class="arrow left"></div>';
    nextBtn.innerHTML = '<div class="arrow right"></div>';

    // check to see if there are any arrow styles that need to be overridden in the default settings.
    var navArrows = _.element.getElementsByTagName('button');
    if(_.def.arrowsColor != '')
        for (var i = 0; i < navArrows.length; i++) {
            addClass(navArrows[i].firstChild, _.def.arrowsColor);
        }

    if(_.def.arrowsStyle != '')
        for (var i = 0; i < navArrows.length; i++) {
            addClass(navArrows[i].firstChild, _.def.arrowsStyle);
        }

    nextBtn.onclick = function () {
        _.goNext();
        console.log('[twister] next button');
    }

    prevBtn.onclick = function () {
        _.goPrev();
        console.log('[twister] prev button');
    }
}

twister.prototype.addDots = function() {
    var _ = this;

    // add the .dots--container element for adding card dots.
    var dotContainer = document.createElement('div');
    _.dotContainer = dotContainer;
    dotContainer.className = 'dots--wrapper';
    _.element.append(dotContainer);

    for (var i = 0; i < _.count; i++) {
        var dot = document.createElement('li');
        dot.setAttribute('data-slide', i + 1);
        dot.setAttribute('role', 'button');
        dotContainer.appendChild(dot);
    }

    _.dotContainer.addEventListener('click', function (e) {
        if (e.target && e.target.nodeName == "LI") {
            clearTimeout(_.aP);
            _.goTo = e.target.getAttribute('data-slide');
            _.gotoSlide(_.goTo);

            if(_.def.autoplay == true)
                _.autoPlay();
        }
    }, false);
}

twister.prototype.setDot = function () {
    var _ = this;
    var tardot = _.curSlide - 1;

    // remove the active dot from any existing dot
    for (var j = 0; j < _.count; j++) {
        removeClass(_.dotContainer.querySelectorAll('li')[j], 'active');
    }

    //console.log('[twister] direction: '+_.direction);
    //console.log('[twister] count: '+_.count);
    //console.log('[twister] curSlide: '+_.curSlide);
    //console.log('[twister] tardot: '+tardot);

    if(_.direction == 'init') {
        tardot = 0;
        addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');

    } else if (_.direction == 'next') {
        if(tardot == _.count) {
            tardot = 0;
            addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');
        } else {
            addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');
        }

    } else if (_.direction == 'prev') {
        if(tardot == -1) {
            tardot = _.count - 1;
            addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');
        } else {
            addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');
        }
    } else {
        addClass(_.dotContainer.querySelectorAll('li')[tardot], 'active');
    }
}

twister.prototype.gotoSlide = function (slide) {
    var _ = this;

    for (var j = 0; j < _.count+1; j++) {
        _.sliderInner.querySelectorAll('div')[j].setAttribute("aria-hidden", "true");
    }

    //console.log('[twister] curSlide: '+_.curSlide);
    //console.log('[twister] goto: '+slide);

    if(_.curSlide < slide)
        _.direction = 'next';

    _.curSlide = slide;
    _.sliderInner.style.transition = _.def.speed / 100 + 's ' + _.def.easing;
    _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
    _.sliderInner.querySelectorAll('div')[_.curSlide].setAttribute("aria-hidden", "false");

    _.setDot();
}

twister.prototype.goNext = function () {
    var _ = this;

    if (_.isMoving == false) {
        _.isMoving = true;
        //console.log('[twister] isMoving: '+_.isMoving);

        clearTimeout(_.aP);

        _.sliderInner.style.transition = _.def.speed / 100 + 's ' + _.def.easing;

        for (var j = 0; j < _.count+2; j++) {
            _.sliderInner.querySelectorAll('div')[j].setAttribute("aria-hidden", "true");
        }

        if (_.curSlide < _.count) {
            _.curSlide++;
            _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
        } else {
            _.curSlide++;
            _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
            // reset back to the first card after a small delay. this removes the transition so that the user doesnt know whats happening
            setTimeout(resetToBegining, _.def.interval);
        }
        _.sliderInner.querySelectorAll('div')[_.curSlide].setAttribute("aria-hidden", "false");
        _.direction = 'next';
        _.setDot();

        function resetToBegining() {
            _.curSlide = 1;
            _.sliderInner.style.transition = 'unset';
            _.sliderInner.style.left = '-100%';
        }

        setTimeout(function(){_.isMoving = false}, _.def.interval);
    }

    if(_.def.autoplay == true)
        _.autoPlay();
}

twister.prototype.goPrev = function () {
    var _ = this;

    if (_.isMoving == false) {
        _.isMoving = true;
        //console.log('[twister] isMoving: '+_.isMoving);

        clearTimeout(_.aP);

        _.sliderInner.style.transition = _.def.speed / 100 + 's ' + _.def.easing;

        for (var j = 0; j < _.count+2; j++) {
            _.sliderInner.querySelectorAll('div')[j].setAttribute("aria-hidden", "true");
        }

        if (_.curSlide == 1) {
            _.curSlide = _.curSlide - 1;
            _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
            // reset back to the end of the carousel after a small delay. removes the transition so that there is no visual
            setTimeout(resetToEnd, _.def.interval);
        } else {
            _.curSlide = _.curSlide - 1;
            _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
        }
        _.sliderInner.querySelectorAll('div')[_.curSlide].setAttribute("aria-hidden", "false");
        _.direction = 'prev';
        _.setDot();

        function resetToEnd() {
            _.curSlide = _.count;
            _.sliderInner.style.transition = 'unset';
            _.sliderInner.style.left = '-' + _.curSlide * 100 + '%';
        }

        setTimeout(function(){_.isMoving = false}, _.def.interval);
    }

    if(_.def.autoplay == true)
        _.autoPlay();
}

twister.prototype.autoPlay = function () {
    var _ = this;
    _.aP = setTimeout(function(){_.goNext()}, _.def.interval);
}

twister.prototype.pause = function () {
    var _ = this;
    clearTimeout(_.aP);
}