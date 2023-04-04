'use strict';

// Dynamically adjust rest of page for navigation bar's height.

window.addEventListener('load', function() {
	// navHeight is the height of the navigation bar

	const navHeight = document.getElementsByClassName('nav-bar')[0].offsetHeight;

	// Dynamically make sure that rest of content is just below navigation bar

	document.getElementsByClassName('content-wrapper')[0].children[1].style.paddingTop = navHeight + 'px';
});

window.addEventListener('resize', () => {
	// Get height of navigation bar

	const navHeight = document.getElementsByClassName('nav-bar')[0].offsetHeight;

	// Dynamically make sure that rest of content is just below navigation bar
	
	document.getElementsByClassName('welcome-block')[0].style.paddingTop = navHeight + 'px';
});

window.addEventListener('resize', function() {
	// Width of page

	const width = window.innerWidth;

	// Links shown on a device below 600 pixels in width

	const hamburgerMenuLinks = document.getElementsByClassName('mobile-a-wrapper')[0];

	if (width > 600) {
		// Hide hamburger menu

		hamburgerMenuLinks.style.display = 'none';
	}
});

/**
 * Hamburger menu navigation
 */

const hamMenuButton = document.getElementById('nav-ham-menu');
const hamMenu = document.getElementsByClassName('mobile-a-wrapper')[0];

function openHamMenu() {
	hamMenu.style.display = 'flex';
}

function closeHamMenu() {
	hamMenu.style.display = 'none';
}

function hamMenuOpen() {
	if (hamMenu.style.display === 'flex') {
		return true;
	} else if (hamMenu.style.display === 'none') {
		return false;
	} else {
		return false;
	}
}

hamMenuButton.addEventListener('click', function() {
	console.log('Hamburger menu tapped.');
	if (hamMenuOpen()) {
		closeHamMenu();
	} else {
		openHamMenu();
	}
});

window.addEventListener('resize', function() {
	if (window.innerWidth >= 600 && hamMenuOpen()) {
		closeHamMenu();
	}
});

/**
 * Slideshow section
 */

const slideshowBlocks = Array.from(document.getElementsByClassName('slideshow-block'));

for (let x in slideshowBlocks) {
	slideshowBlocks[x].currentSlideshowIndex = 0;
}

/**
 * Searches through an array for an element with a matching class name.
 * Avoid passing arrays with more than one classname or it will return the last element it finds with the matching class name.
 * @param {Array} array 
 * @param {String} className 
 * @returns false if no classname is found or element itself if an element with a matching classname is found
 */

function getElementInArrayWtihClass(array, className) {
	// Ensure both arguments are passed. Throw error if not enough arguments are passed or too many are passed.

	if (arguments.length !== 2) {
		throw Error('Either too many or too little arguments passed.');
	}

	// Throw error if className is not a string

	if (typeof className !== 'string') throw TypeError('Passed ' + typeof className + ' as argument. Should have passsed string.')
	// Ensure if a HTMLCollection is passed in it is converted to an array to avoid headache

	array = Array.from(array);

	// Is either set to false if no element is found or the element itself if found.

	let foundElement = false;

	// For each element in the array

	array.forEach(function(value) {
		if (typeof value !== 'object') {
			return;
		}

		// Array of each individual class name in element

		const classnames = value.className.split(' ');
		'use strict';

		const slideshowBlocks = Array.from(document.getElementsByClassName('slideshow-block'));
		
		for (let x in slideshowBlocks) {
			slideshowBlocks[x].currentSlideshowIndex = 0;
		}
		
		/**
		 * Searches through an array for an element with a matching class name.
		 * Avoid passing arrays with more than one classname or it will return the last element it finds with the matching class name.
		 * @param {Array} array 
		 * @param {String} className 
		 * @returns false if no classname is found or element itself if an element with a matching classname is found
		 */
		
		function getElementInArrayWtihClass(array, className) {
			// Ensure both arguments are passed. Throw error if not enough arguments are passed or too many are passed.
		
			if (arguments.length !== 2) {
				throw Error('Either too many or too little arguments passed.');
			}
		
			// Throw error if className is not a string
		
			if (typeof className !== 'string') throw TypeError('Passed ' + typeof className + ' as argument. Should have passsed string.')
			// Ensure if a HTMLCollection is passed in it is converted to an array to avoid headache
		
			array = Array.from(array);
		
			// Is either set to false if no element is found or the element itself if found.
		
			let foundElement = false;
		
			// For each element in the array
		
			array.forEach(function(value) {
				if (typeof value !== 'object') {
					return;
				}
		
				// Array of each individual class name in element
		
				const classnames = value.className.split(' ');
		
				// For each classname in each element
		
				classnames.forEach(function (classname) {
					// Must be an exact match to return an element
		
					if (classname === className) {
						foundElement = value;
					}
				});
		
			});
		
			return foundElement;
		}
		
		/**
		 * Changes all slideshow images on page by one.
		 * @returns true or throws an error if there is a problem.
		 */
		
		 function moveSlideshowImagesUp() {
			slideshowBlocks.forEach(function (value, index) {
				const images = Array.from(getElementInArrayWtihClass(value.children, 'slideshow-images').children);
		
				for (let index in images) {
					images[index] = images[index].src;
				}
		
				const slideshowIndex = value.currentSlideshowIndex;
		
				value.style.background = 'url(' + String(images[slideshowIndex]) + ') rgba(0, 0, 0, 0.5)';
		
				value.currentSlideshowIndex++;
				
				if (value.currentSlideshowIndex === images.length) {
					value.currentSlideshowIndex = 0;
				}
			});
		}
		
		setInterval(moveSlideshowImagesUp, 5000);
		
		window.addEventListener('load', moveSlideshowImagesUp);
		// For each classname in each element

		classnames.forEach(function (classname) {
			// Must be an exact match to return an element

			if (classname === className) {
				foundElement = value;
			}
		});

	});

	return foundElement;
}

/**
 * Changes all slideshow images on page by one.
 * @returns true or throws an error if there is a problem.
 */

 function moveSlideshowImagesUp() {
	slideshowBlocks.forEach(function (value, index) {
		const images = Array.from(getElementInArrayWtihClass(value.children, 'slideshow-images').children);

		for (let index in images) {
			images[index] = images[index].src;
		}

		const slideshowIndex = value.currentSlideshowIndex;

		value.style.background = 'url(' + String(images[slideshowIndex]) + ') rgba(0, 0, 0, 0.5)';

		value.currentSlideshowIndex++;
		
		if (value.currentSlideshowIndex === images.length) {
			value.currentSlideshowIndex = 0;
		}
	});
}


window.addEventListener('load', moveSlideshowImagesUp);