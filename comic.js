DISTANCE_THRESHOLD = 0.5;

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function clean_search_string(s) {
	var new_string = "";
	for (var i = 0; i < s.length; i++) {
		var c = s[i];

		if ("\"'!@#$%^&*()_+=`~\|{}[]".indexOf(c) !== -1)
			continue;

		if (c === " ")
			c = "_";

		new_string += c;
	}
	return new_string;
}

// https://gist.github.com/andrei-m/982927#gistcomment-1888863
var levenshtein = function(a, b) {
	if(a.length == 0) return b.length;
	if(b.length == 0) return a.length;

	// swap to save some memory O(min(a,b)) instead of O(a)
	if (a.length > b.length) {
		var tmp = a;
		a = b;
		b = tmp;
	}

	var row = [];
	// init the row
	for (var i = 0; i <= a.length; i++) {
		row[i] = i;
	}

	// fill in the rest
	for (var i = 1; i <= b.length; i++) {
		var prev = i;
		for (var j = 1; j <= a.length; j++) {
			var val;
			if (b.charAt(i-1) == a.charAt(j-1)){
				val = row[j-1]; // match
			} else {
				val = Math.min(row[j-1] + 1, // substitution
						prev + 1,     // insertion
						row[j] + 1);  // deletion
			}
			row[j - 1] = prev;
			prev = val;
		}
		row[a.length] = prev;
	}

	return row[a.length];
}




function toggle_class(element, c) {

	// Choose what kind of change we want to do.
	if (hasClass(element, c)) {
		element.classList.remove(c);
	} else {
		element.classList.add(c);
	}
}

if (!Array.prototype.contains)
	Array.prototype.contains = function (item) {
		return this.indexOf(item) != -1;
	};


function preloadImages(array) {
	if (!preloadImages.list) {
		preloadImages.list = [];
	}
	var list = preloadImages.list;
	for (var i = 0; i < array.length; i++) {
		var img = new Image();
		img.onload = function() {
			var index = list.indexOf(this);
			if (index !== -1) {
				// remove image from the array once it's loaded
				// for memory consumption reasons
				list.splice(index, 1);
			}
		}
		list.push(img);
		img.src = array[i];
	}
}

var get_relative = function(array, jump) {
	return function(item) {
		var index = array.indexOf(item) + jump;
		if (index >= 0 && index < array.length)
			return array[index];
		return null;
	};
};

var get_consecutive = function (first, f, times) {
	var results = [];
	var tmp = first;
	for (var i = 0; i < times; i++)
		if (tmp = f(tmp))
			results.push(tmp);
	return results;
};

var is_request_success = function(r) {
	return r.status >= 200 && r.status < 400;
};

var KeyListener = (function () {
	var handlers = {
		"modal": null,
		"story": null
	};

	var modal = document.getElementById("comic-modal");
	var image_area = document.getElementById("image-area");

	setTimeout(function () {
		$(document).keydown(function (e) {
			console.log("Key Pressed " + e.keyCode);
			if (hasClass(modal, "is-hidden") && handlers.story && handlers.story(e))
				e.stopPropagation();
			else if (handlers.modal && handlers.modal(e))
				e.stopPropagation();
		});
	});

	return handlers;
})();


var Story = function(name, pages) {
	console.log("Loaded story called " + name);
	console.log("With pages ");
	console.log(pages);

	var current_page = pages.length > 0 ? pages[0] : null;

	var get_next_page = get_relative(pages, 1);
	var get_last_page = get_relative(pages, -1);

	var set_page = function(chooser) {
		var page = chooser(current_page);
		if (page === null)
			return null;
		return (current_page = page);
	};

	var set_local = function (item) {};

	if (typeof(Storage) !== "undefined") {
		if (localStorage.getItem(name))
			current_page = localStorage.getItem(name);
		set_page = (function (wrapped) {
			return function (chooser) {
				var next = wrapped(chooser);
				if (next)
					localStorage.setItem(name, next);
				return next;
			};
		})(set_page);
	}

	var update = (function() {
		var image = document.getElementById("display");
		var set_url = function () {
			preloadImages(get_consecutive(current_page, get_next_page, 10));
			if (current_page)
			{
				console.log("Setting page to " + current_page);
				image.src = current_page;
			}
			else
			{
				console.log("Not setting page");
			}
		};
		set_url();
		return set_url;
	})();

	console.log("Attaching story");
	KeyListener.story = function (keyboard_event) {
			var keycode = keyboard_event.keyCode;

			var chooser = null;

			console.log(keycode);

			// Last if:
			// Left Arrow, Backspace
			if ([37, 8].contains(keycode))
				chooser = get_last_page;

			// Next if:
			// Right Arrow, Space
			if ([39, 32].contains(keycode))
				chooser = get_next_page;

			// Check to see if we have a chooser
			// And if there was a page in that direction
			if (chooser) {
				if (set_page(chooser))
					update();
				return true;
			}
	};
};



setTimeout(function () {
	var LOCAL_STORAGE_STORY_KEY = "-SelectedStory";
	var modal = document.getElementById("comic-modal");
	var modal_close = document.getElementById("comic-modal-close");
	var modal_search = document.getElementById("comic-modal-search");
	var modal_list = document.getElementById("comic-modal-list");
	var image_area = document.getElementById("image-area");

	var toggle_modal = modal_close.onclick = function () {
		console.log("Toggling modal");
		toggle_class(modal, "is-hidden");
		toggle_class(image_area, "is-hidden");
	};
	var on_key = KeyListener.modal = function (e) {
		// If not escape key
		if (e.keyCode !== 27)
			return;
		toggle_modal();
	};

	var on_list_item_click = function (node) {

		return function () {

			localStorage.setItem(LOCAL_STORAGE_STORY_KEY, node.title);


			// Load site
			var request = new XMLHttpRequest();

			request.open('POST', "./metadata/list_" + node.title + ".json", true);
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

			request.onload = function() {

				console.log("Request returned info");

				if (!is_request_success(request))
				{
					alert("Couldn't load " + node.title);
					return;
				}

				toggle_modal();

				Story(node.title, JSON.parse(request.responseText));

			};

			request.send();

		};
	};

	var list = [];

	(function() {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("POST", "./metadata/list.json", true);
		xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		xmlHttp.onload = function() {
			if (!is_request_success(xmlHttp)) {
				alert("Error contacting site");
				return;
			}

			console.log("Got list from server");


			var stored_title = undefined;
			if (typeof(Storage) !== "undefined") {
					console.log("Loading from storage");
					stored_title = localStorage.getItem(LOCAL_STORAGE_STORY_KEY);
			}

            var server_list = JSON.parse(xmlHttp.responseText);
			server_list.forEach(function (title) {
				console.log("Logging " + title);

				var list_node = document.createElement("ul");
				var link = document.createElement("a");
				link.href = "#";
				link.appendChild(document.createTextNode(title));
				list_node.appendChild(link);

				modal_list.appendChild(list_node);

				var list_entry = {
					"title": title,
					"node": list_node
				};

				var click_handler = on_list_item_click(list_entry);

				link.onclick = click_handler;
				if (stored_title === title) {
					link.onclick();
				}

				list.push(list_entry);
			});

		};

		xmlHttp.send();
	})();



	$(modal_search).keyup(function (event) {

		var current = modal_search.value;

		// Wait at least 50ms to make sure
		// they aren't still typing.
		setTimeout(function () {

			// Check to see if the user started typing
			// again.
			if (current !== modal_search.value)
				return;

			// Sanitize this to make it as close to a folder
			// name as possible.
			var search_string = clean_search_string(current).toLowerCase();
			console.log(search_string);

			list.forEach(function (node) {

				// Check to see if the user started typing again.
				// This time it would be mid-filter.
				if (current !== modal_search.value)
					return;
				var title = node.title.toLowerCase();
				console.log("Title: " + title + ", Search: " + search_string);
				var matches = title.indexOf(search_string) !== -1;

				if (!matches) {
					var average_len = Math.min(node.title.length, search_string.length);
					var distance = levenshtein(node.title, search_string);
					matches = distance / average_len <= DISTANCE_THRESHOLD;
				}
				if (!matches) {
					node.node.classList.add("is-hidden");
				} else {
					node.node.classList.remove("is-hidden");
				}
			});
		}, 50);


		event.stopPropagation();
	});
});
