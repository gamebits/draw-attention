;(function ($, window, document, undefined) {

	/* ------------------------------------------- */
	/* Global vars */
	/* ------------------------------------------- */

	var opts,
		resizing = false;

	/* ------------------------------------------- */
	/* Browser support checking */
	/* ------------------------------------------- */
	var hasCanvas,
		hasPointerEvents,
		doHighlights = false;

	/* test if browser supports canvas */
	hasCanvas = (function() {
		return !!document.createElement('canvas').getContext;
	})();

	/* test if browser supports non-SVG pointer-events */
	hasPointerEvents = (function () {
		var supports = false,
			a = document.createElement("x");
			a.style.cssText = "pointer-events:auto;";

		if (window.PointerEvent) {
			supports = true;
		} else if (a.style.pointerEvents === 'auto') {
			supports = true;
		}
		return supports;
	})();

	if (hasCanvas && hasPointerEvents) {
		doHighlights = true;
	}

	/* ------------------------------------------- */
	/* Helpers */
	/* ------------------------------------------- */

	var convertHexToDecimal,
		convertToRgba,
		updateImageInfo;

	convertHexToDecimal = function(hex) {
		return Math.max(0, Math.min(parseInt(hex, 16), 255));
	}

	convertToRgba = function(color, opacity) {
		color = color.replace('#', '');
		return 'rgba(' + convertHexToDecimal(color.substr(0, 2)) + ',' + convertHexToDecimal(color.substr(2, 2)) + ',' + convertHexToDecimal(color.substr(4, 2)) + ',' + opacity + ')';
	}

	updateImageInfo = function(img, newInfo) {
		var oldInfo = img.data('info');
		img.data('info', $.extend({}, oldInfo, newInfo));
	}

	/* ------------------------------------------- */
	/* Canvas magic */
	/* ------------------------------------------- */

	var areaDraw,
		areaOptions,
		drawShape,
		drawPoly,
		drawCircle,
		drawRect;

	areaDraw = function(img, area) {
		if (!doHighlights)
			return;

		var w = img.data('width'),
			h = img.data('height'),
			info = img.data('info'),
			id = area.attr('id'),
			canvas = $('#canvas-' + id),
			canvasHover = $('#canvasHover-' + id);
		canvas.remove();
		canvasHover.remove();

		if(opts.alwaysVisible) {
			canvas = $('<canvas></canvas>', {
				'id': 'canvas-' + id,
				'class': 'canvas-display'
			}).attr('width', w).attr('height', h);
			info.wrap.append(canvas);
			area.data('canvasDisplay', canvas);
		}

		canvasHover = $('<canvas></canvas>', {
			'id': 'canvasHover-' + id,
			'class': 'canvas-hover',
		}).attr('width', w).attr('height', h);
		info.wrap.append(canvasHover);
		area.data('canvasHover', canvasHover);
		canvas.delay(300).addClass('canvas-show');

		info.wrap.find('canvas').off().on('touchstart', function(e){
			e.preventDefault(); //iOS bug fix
		});

		drawShape(img, area);
		if (area.hasClass('active')) {
			showActiveArea(img, area);
		}
	};

	areaOptions = function(area) {
		function findByName(arr, item) {
			var found = $.grep(arr, function(el) { return el.name === item; });
			return found[0];
		}

		var areaColorSchemeName = area.data('color-scheme') ? area.data('color-scheme') : 'default',
			areaColorScheme = findByName(opts.colorSchemes, areaColorSchemeName);

		areaColorScheme = areaColorScheme ? areaColorScheme : findByName(opts.colorSchemes, 'default');

		return areaColorScheme;
	};

	drawShape = function(img, area) {
		var domCanvas = area.data('canvasDisplay') ? area.data('canvasDisplay').get(0) : null,
			domCanvasHover = area.data('canvasHover') ? area.data('canvasHover').get(0) : null;

		function findShape(canvas, type) {
			var context = canvas.getContext('2d'),
				shape = area.attr('shape'),
				coords = area.attr('coords').split(','),
				xCoords = [],
				yCoords = [];


			context.clearRect(0, 0, canvas.width, canvas.height);

			for(var i=0; i<coords.length; i++) {
				if(i%2 == 0) {
					xCoords.push(coords[i]);
				} else {
					yCoords.push(coords[i]);
				}
			}

			switch(shape) {
				case 'poly':
					drawPoly(context, xCoords, yCoords, area, type);
					break;
				case 'circle':
					drawCircle(context, xCoords, yCoords, area, type);
					break;
				case 'rect':
					drawRect(context, xCoords, yCoords, area, type);
					break;
			}
		}

		if (domCanvas) {
			findShape(domCanvas, 'display');
		}

		if (domCanvasHover) {
			findShape(domCanvasHover, 'hover');
		}
	};

	drawPoly = function(context, xCoords, yCoords, area, type) {
		var colorScheme = areaOptions(area);
		context.beginPath();
		context.moveTo(xCoords[0], yCoords[0]);
		for(var j=1; j<xCoords.length; j++) {
			context.lineTo(xCoords[j], yCoords[j]);
		}
		context.closePath();
		context.fillStyle = convertToRgba(colorScheme[type]['fillColor'], colorScheme[type]['fillOpacity']);
		context.fill();
		context.lineWidth = colorScheme.borderWidth;
		context.strokeStyle = convertToRgba(colorScheme[type]['borderColor'], colorScheme[type]['borderOpacity']);
		context.stroke();
	};

	drawCircle = function(context, xCoords, yCoords, area, type) {
		var colorScheme = areaOptions(area);
		context.beginPath();
		context.arc(xCoords[0], yCoords[0], xCoords[1], 0, Math.PI*2, true);
		context.fillStyle = convertToRgba(colorScheme[type]['fillColor'], colorScheme[type]['fillOpacity']);
		context.fill();
		context.lineWidth = colorScheme.borderWidth;
		context.strokeStyle = convertToRgba(colorScheme[type]['borderColor'], colorScheme[type]['borderOpacity']);
		context.stroke();
	};

	drawRect = function(context, xCoords, yCoords, area, type) {
		var colorScheme = areaOptions(area);
		context.fillStyle = convertToRgba(colorScheme[type]['fillColor'], colorScheme[type]['fillOpacity']);
		context.lineWidth = colorScheme.borderWidth;
		context.strokeStyle = convertToRgba(colorScheme[type]['borderColor'], colorScheme[type]['borderOpacity']);
		context.fillRect(xCoords[0], yCoords[0], xCoords[1]-xCoords[0], yCoords[1]-yCoords[0]);
		context.strokeRect(xCoords[0], yCoords[0], xCoords[1]-xCoords[0], yCoords[1]-yCoords[0]);
	};


	/* ------------------------------------------- */
	/* Event handling */
	/* ------------------------------------------- */

	var mapResize,
		resizeDelay,
		resizeStart,
		resizeComplete,
		imgEvents,
		areaEvents,
		mapOver,
		mapOut,
		mapClick,
		showActiveArea;

	mapResize = function(img) {
		var info = img.data('info'),
			natW = info.naturalWidth,
			natH = info.naturalHeight,
			wPercent = img.data('width')/100,
			hPercent = img.data('height')/100,
			areas = info.areas;

		// Resize the map coordinates
		areas.each(function(index){
			var area = $(this);
			if (!area.data('coords')) {
				area.data('coords', area.attr('coords'));
			}

			var coords = area.data('coords').split(','),
				coordsPercent = new Array(coords.length);

			for (var i=0; i<coordsPercent.length; ++i) {
				if (i%2 === 0) {
					coordsPercent[i] = parseInt(((coords[i]/natW)*100)*wPercent);
				} else {
					coordsPercent[i] = parseInt(((coords[i]/natH)*100)*hPercent);
				}
			}
			area.attr('coords', coordsPercent.toString());
			areaDraw(img, $(this));
		});

		// Resize the image wrapper
		var info = img.data('info'),
			wrap = info.wrap;

		wrap.css({
			'maxWidth': natW
		});
	};

	resizeDelay = function() {
		resizing = false;
		$(window).trigger('resizeComplete.responsilight');
	};

	resizeStart = function(img) {
		var canvases = img.siblings('.canvas-show').removeClass('canvas-show');
	};

	imgEvents = function(img) {
		img
			.on('init.responsilight', function(){
				img.data('initialized', true);
				img.addClass('responsilight-initialized');
				linkToArea(img);
				mapResize(img);
			});

		$(window)
			.on('resizeStart.responsilight', function(){
				resizeStart(img);
			})
			.on('resizeComplete.responsilight', function(){
				mapResize(img);
			});
	}

	areaEvents = function(img, area) {
		var trigger = opts.eventTrigger;

		// Translate browser events to responsilight events
		area.on('mouseover touchstart mouseout touchend click focus blur keypress', function(e){
			var type = e.type;
			switch(type) {
				case 'touchstart':
					mapOver(img, area, e);
					mapClick(img, area, e);
					break;
				case 'touchend':
					break;
				case 'mouseout':
					mapOut(img, area, e);
					break;
				case 'blur':
					mapOut(img, area, e);
					break;
				case 'mouseover':
					mapOver(img, area, e);
					break;
				case 'focus':
					mapOver(img, area, e);
					break;
				case 'click':
				 mapClick(img, area, e);
				 break;
				case 'keypress':
					if (trigger === 'click') {
						mapClick(img, area, e);
					}
					if (e.which === 13) {
						mapClick(img.area.e);
					}
					break;
			}
		});
	};

	mapOver = function(img, area, e) {
		area.trigger('over.responsilight');

		area.data('canvasHover').addClass('canvas-show');

		if (opts.alwaysVisible) {
			area.data('canvasDisplay').removeClass('canvas-show');
		}

		if (opts.eventTrigger === 'hover' && e.type !== 'touchstart') {
			area.addClass('active');
			area.trigger('active.responsilight');
		}
	};

	mapOut = function(img, area, e) {
		area.trigger('out.responsilight');

		if (opts.eventTrigger === 'hover') {
			area.data('canvasHover').removeClass('canvas-show');
			area.removeClass('active');
			area.trigger('inactive.responsilight');
			if (opts.alwaysVisible) {
				area.data('canvasDisplay').addClass('canvas-show');
			}
		} else if (!area.hasClass('active')) {
			area.data('canvasHover').removeClass('canvas-show');
			if (opts.alwaysVisible) {
				area.data('canvasDisplay').addClass('canvas-show');
			}
		}
	};

	mapClick = function(img, area, e) {
		area.trigger('areaClick.responsilight');

		if (opts.eventTrigger === 'hover' && e.type !== 'keypress' ) {
			return;
		}

		area.toggleClass('active');

		if (area.hasClass('active')) {
			area.trigger('active.responsilight');
		} else {
			area.trigger('inactive.responsilight');
		}

		var oldActive = area.siblings('.active').removeClass('active');
		if (oldActive.length) {
			oldActive.data('canvasHover').removeClass('canvas-show');
			if (opts.alwaysVisible) {
				oldActive.data('canvasDisplay').addClass('canvas-show');
			}
		}
	};

	showActiveArea = function(img, area) {
		area.data('canvasHover').addClass('canvas-show');
		area.trigger('active.responsilight');
	};

	/* ------------------------------------------- */
	/* Prep the Image for all the fun stuff to come */
	/* ------------------------------------------- */

	var prepImage,
		getImageOptions,
		getImageMap,
		getSize,
		getNaturalSize,
		wrapImage,
		prepAreas,
		areaIDs,
		linkToArea;

	prepImage = function(img){
		if(typeof(img.attr('usemap')) === undefined)
			return;

		if (img.data('initialized')) {
			// Re-initialization
			getImageOptions(img);
			getSize(img);
			img.trigger('reInit.responsilight');
		} else {
			// Initial page load
			$('<img />').load(function() {
				getImageOptions(img);
				getImageMap(img);
				getSize(img);
				getNaturalSize(img);
				wrapImage(img);
				prepAreas(img);
				imgEvents(img);
				img.trigger('init.responsilight');
			}).attr('src', img.attr('src'));
		}
	};

	getImageOptions = function(img) {
		var dataOpts = {},
			fillColor = img.data('highlight-color'),
			fillOpacity = img.data('highlight-opacity'),
			borderColor = img.data('highlight-border-color'),
			borderWidth = img.data('highlight-border-width'),
			borderOpacity = img.data('highlight-border-opacity'),
			eventTrigger = img.data('event-trigger'),
			alwaysVisible = img.data('always-visible');

		// Event trigger
		if (eventTrigger) {
			dataOpts.eventTrigger = eventTrigger;
		}

		// Always visible
		if (alwaysVisible) {
			dataOpts.alwaysVisible = alwaysVisible;
		}

		// Create colorSchemes property of dataOpts if there are color schemes
		if (opts && opts.colorSchemes && opts.colorSchemes.length) {
			dataOpts.colorSchemes = opts.colorSchemes.concat();
		} else if (fillColor || fillOpacity || borderColor || borderWidth || borderOpacity) {
			dataOpts.colorSchemes = [{
				name: 'default',
				hover: {}
			}];
		}

		if (dataOpts.colorSchemes && dataOpts.colorSchemes.length) {
			$.grep(dataOpts.colorSchemes, function(el){
				if (el.name === 'default') {
					if (fillColor) {
						el.hover.fillColor = fillColor;
					}
					if (fillOpacity) {
						el.hover.fillOpacity = fillOpacity;
					}
					if (borderColor) {
						el.hover.borderColor = borderColor;
					}
					if (borderWidth) {
						el.borderWidth = borderWidth;
					}
					if (borderOpacity) {
						el.hover.borderOpacity = borderOpacity;
					}
				}
				return el;
			});
		}

		opts = $.extend({}, $.fn.responsilight.defaults, opts, dataOpts);
	};

	getImageMap = function(img) {
		var mapName = img.attr('usemap').replace('#', ''),
			map = $('map[name="' + mapName + '"]');
		updateImageInfo(img, {
			mapName: mapName,
			map: map,
			areas: map.find('area')
		});
	};

	getSize = function(img) {
		img.data('width', img.width());
		img.data('height', img.height());
	}

	getNaturalSize = function(img) {
		var domImg = img.get(0);
		updateImageInfo(img, {
			naturalWidth: domImg.naturalWidth,
			naturalHeight: domImg.naturalHeight
		});
	};

	wrapImage = function(img) {
		var mapName = img.data('info').mapName,
			wrap = img.parent('#wrap-' + mapName);

		if (!wrap.length) {
			img.wrap('<div class="responsilight-wrap" id="wrap-' + mapName + '"></div>');
			wrap = img.parent('#wrap-' + mapName);
		}
		updateImageInfo(img, {
			wrap: wrap
		});
	};

	prepAreas = function(img) {
		var areas = img.data('info').areas;
		areas.each(function(index){
			areaEvents(img, $(this));
			areaIDs(img, $(this), index);
			areaDraw(img, $(this));
		});
	};

	areaIDs = function(img, area, index) {
		var mapName = img.data('info').mapName;
		area.attr('id', mapName + '-area-' + index);
	};

	linkToArea = function(img) {
		var hash = window.location.hash,
			map = img.data('info').map,
			area;
		if (hash) {
			area = map.find('area[href="' + hash + '"]');
		} else {
			return;
		}

		if (!area.length) {
			return;
		}

		area.addClass('active');
		showActiveArea(img, area);

		var imgTop = img.offset().top,
			coords = area.attr('coords').split(','),
			yCoords = [];

		for (var i=0; i<coords.length; i++) {
			if (i%2 != 0) {
				yCoords.push(coords[i]);
			}
		}

		var areaImgTop  = Math.min.apply(Math, yCoords),
			areaImgBottom = Math.max.apply(Math, yCoords),
			windowHeight = $(window).height(),
			windowBottom = imgTop + windowHeight,
			areaBottom = imgTop + areaImgBottom,
			areaTop = imgTop + areaImgTop,
			padding = 50,
			scrollCoord;

		if (areaBottom > windowBottom) {
			scrollCoord = imgTop + (areaBottom - windowBottom) + padding;
			if ((areaBottom - areaTop) > windowHeight) {
				scrollCoord = areaTop - padding;
			}
		} else {
			scrollCoord = imgTop - padding;
		}

		setTimeout(function(){
			window.scrollTo(0, scrollCoord);
		}, 1);

	};

	/* ------------------------------------------- */
	/* Responsilighter plugin */
	/* ------------------------------------------- */

	$.fn.responsilight = function (options) {

		var $img = this;

		opts = options;

		function responsilight_init(){
			$img.each(function(){
				prepImage($(this));
			});
		}

		$(window).on('resize orientationchange', function() {
			if (!resizing) {
				resizing = true;
				$(this).trigger('resizeStart.responsilight');
				setTimeout(resizeDelay, 800);
			}
		});

		$(window).on('resizeComplete.responsilight', function(){
			responsilight_init();
		}).trigger('resizeComplete.responsilight');

		return this;
	};

	$.fn.responsilight.defaults = {
		eventTrigger: 'click',
		alwaysVisible: false,
		colorSchemes: [
			{
				name: 'default',
				borderWidth: 1,
				display: {
					fillColor: '#000000',
					fillOpacity: '0.5',
					borderColor: '#000000',
					borderOpacity: '0.75'
				},
				hover: {
					fillColor: '#ffffff',
					fillOpacity: '0.8',
					borderColor: '#ff0000',
					borderOpacity: '0.8'
				}
			}
		]
	}

}(jQuery, window, document));