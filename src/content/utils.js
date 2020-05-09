// folder tests utilities

// if (!context) {
var context = {};

function loadPreferences() {
	console.debug('LoadPreferences');
	Services.scriptloader.loadSubScript("chrome://global/content/preferencesBindings.js", context, "UTF-8" /* The script's encoding */);

	Preferences.addAll([

		{ id: "extensions.iet-ng-tests.test_cycles", type: "int" },
		{ id: "extensions.iet-ng-tests.test_fcount", type: "int" },
		{ id: "extensions.iet-ng-tests.test_mcount", type: "int" },

		{ id: "extensions.iet-ng-tests.test_msize", type: "int" },
		{ id: "extensions.iet-ng-tests.test_updatecycle", type: "int" },
		{ id: "extensions.iet-ng-tests.test_updatecount", type: "int" },
		{ id: "extensions.iet-ng-tests.test_pawaitcycle", type: "int" },
		{ id: "extensions.iet-ng-tests.test_usecfawait", type: "bool" },
		// { id: "extensions.iet-ng-tests.test_", type: "bool" },
		// { id: "extensions.iet-ng-tests.test_", type: "bool" },

	]);

	var w = getMail3Pane();

	w.Preferences = Preferences;
	console.debug(w.Preferences);
}


function openIETtestoptions() {
	window.openDialog("chrome://iet-ng-tests/content/options.xul", "", "chrome,modal,centerscreen");
}


function IETwritestatus(text) {
	if (document.getElementById("statusText")) {
		document.getElementById("statusText").setAttribute("label", text);
		var delay = 5000;
		if (delay > 0)
			window.setTimeout(function () { IETdeletestatus(text); }, delay);
	}
}


function IETdeletestatus(text) {
	if (document.getElementById("statusText").getAttribute("label") === text)
		document.getElementById("statusText").setAttribute("label", "");
}



function promptImportDirectory() {
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	var res;

	// Open the filepicker to choose the directory
	fp.init(window, "Choose Import Directory", nsIFilePicker.modeGetFolder);
	// Set the filepicker to open the last opened directory
	if (fp.show)
		res = fp.show();
	else
		res = IETopenFPsync(fp);

	IETwritestatus("Import Directory: " + fp.file.path);
	var d = fp.file.directoryEntries;

	return fp;
}


function IETopenFPsync(fp) {
	let done = false;
	let rv, result;
	fp.open(result => {
		rv = result;
		done = true;
	});
	let thread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
	while (!done) {
		thread.processNextEvent(true);
	}
	return rv;
}

function getMail3Pane() {
	var w = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow("mail:3pane");
	return w;
}

window.addEventListener("load", function (e) { loadPreferences(e); }, false);