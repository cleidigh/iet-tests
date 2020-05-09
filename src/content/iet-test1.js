// folder tests

// top-level menu options


var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");



function createFoldersT1() {

	let msgFolder = GetSelectedMsgFolders()[0];
	console.debug("FolderName " + msgFolder.name);

	var test_cycles = 10;
	var test_fcount = 500;
	var test_mcount = 0;
	var test_msize = 10000;


	test_cycles = Preferences.get("extensions.iet-ng-tests.test_cycles").value;
	console.debug(test_cycles);
	test_fcount = Preferences.get("extensions.iet-ng-tests.test_fcount").value;
	test_mcount = Preferences.get("extensions.iet-ng-tests.test_mcount").value;
	test_msize = Preferences.get("extensions.iet-ng-tests.test_msize").value;
	var test_updateCycle = Preferences.get("extensions.iet-ng-tests.test_updatecycle").value;
	var test_updateCount = Preferences.get("extensions.iet-ng-tests.test_updatecount").value;
	var test_pawaitCycle = Preferences.get("extensions.iet-ng-tests.test_pawaitcycle").value;
	var test_usecfawait = Preferences.get("extensions.iet-ng-tests.test_usecfawait").value;

	let folderArray = createFolders(msgFolder, test_cycles, test_fcount, test_mcount, test_msize, test_updateCycle, test_pawaitCycle, test_updateCount, test_usecfawait);

}

async function createFolderStructureT2() {

	let msgFolder = GetSelectedMsgFolders()[0];

	var osFolder = promptImportDirectory();

	var dirs = dirWalk(osFolder.file);
	for (let index = 0; index < dirs.length; index++) {
		const element = dirs[index];
		console.debug(element);

	}
	test_cycles = Preferences.get("extensions.iet-ng-tests.test_cycles").value;
	console.debug(test_cycles);

	for (let index = 0; index < test_cycles; index++) {
		createFolderStructure(osFolder, osFolder.file.path, msgFolder, dirs);
		await resetSelectedFolder(msgFolder);
	
	}
}

function createFolderStructure(osFolder, rootOSFolder, msgFolder, dirs) {
	let startTime = new Date();

	var curParentFolder = null;
	var msgfolderArray = [];

	// console.debug(rootOSFolder);
	var folderArray = dirs.map(d => {
		let da = d.split(rootOSFolder + '\\')[1];
		return da;
	});

	for (let index = 0; index < folderArray.length; index++) {
		if (index % 400 === 0) {
			msgFolder.ForceDBClosed();
			console.debug('update');
		}

		let newFolderName = OS.Path.basename(folderArray[index]);
		let OSDirPath = OS.Path.dirname(folderArray[index]);

		if (OSDirPath === '.') {
			curParentFolder = msgFolder;
			curParentFolder.createSubfolder(newFolderName, msgWindow);
			// console.debug('created: '+ newFolderName);
			msgfolderArray[index] = curParentFolder.getChildNamed(newFolderName);
		} else {
			curParentFolder = msgfolderArray[folderArray.indexOf(OSDirPath)];
			curParentFolder.createSubfolder(newFolderName, msgWindow);
			// console.debug('created subfolder: '+ newFolderName);
			msgfolderArray[index] = curParentFolder.getChildNamed(newFolderName);
		}
	}
	let stepTime = new Date();
	console.debug('CreateFolders ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');

}

// 100 folders, 100msg, 10k size - 58s

async function createFolders(parent, cycles, fcount, mcount, msize, updateCycle, pawaitCycle, test_updateCount, test_usecfawait) {
	let count2 = cycles;
	var count = fcount;

	var mCountTotal = 0;
	var delay = 60;

	// count : # folders
	// count2 : test cycles
	// mcount : # messages per folder
	// msize : size in bytes
	//  var msize = 10000;

	console.debug('CreateFolders Test1 - Start Cycles: ' + count2 + ' Folders: ' + count + ' MsgPerFolder: ' + mcount + ' MsgSize: ' + msize);


	let afileBase = "-subfolder";
	let folderName = "";

	for (let i2 = 1; i2 < count2 + 1; i2++) {
		var fDBClosedCount = test_updateCount;

		let startTime = new Date();
		console.debug('Time: ' + startTime.toISOString());

		var i = 0;
		try {
			const folderPromises = [];
			for (i = 1; i < count + 1; i++) {
				folderName = `${i}${afileBase}`;

				if (test_usecfawait) {
					folderPromises.push(promiseFolderAdded(folderName));
				}
				parent.createSubfolder(folderName, msgWindow);

				if (test_usecfawait && ( i % pawaitCycle === 0 && pawaitCycle || (i % updateCycle === 0 && updateCycle))) {
					await Promise.all(folderPromises);
					console.debug('Created Folder/await : ' + i2 + ' :  ' + i);
				}

				if (i % updateCycle === 0 && updateCycle && fDBClosedCount) {
					parent.ForceDBClosed();
					fDBClosedCount--;
					console.debug('ForceDBClosed : ' + i + ' : ' + folderName);
				}
			}
		} catch (e) {
			console.debug(e + " : Folder count = " + i);
			alert(e + " : Folder count = " + i);
			return;
		}

		let stepTime = new Date();
		console.debug('CreateFolders ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');
		IETwritestatus('Folder Cycle: ' + i2 + '  Folder: ' + folderName + '  Time ' + (stepTime - startTime) / 1000 + ' sec');
		await sleepA(500);

		await resetSelectedFolder(parent);
		console.debug('AfterReset');

	}

	console.debug('Done');
}


async function resetSelectedFolder(folder) {

	let MSG_FOLDER_FLAG_DIRECTORY = 0x0008;
	let top = folder.parent;
	let parent = folder;
	let parentFolderName = folder.name;

	console.debug('DeleteFolder ' + top.name + '  ' + parentFolderName);
	IETwritestatus('Resetting Folder: ' + parentFolderName);
	
	let targets = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);

	targets.appendElement(parent, false);

	top.deleteSubFolders(targets, null);

	top.ForceDBClosed();

	let endTime = new Date();
	// console.debug('Cycle: ' + i2 + ' Time End: ' + (endTime - startTime) / 1000);
	// console.debug('TotalMessages: ' + mCountTotal);

	// let folderPromises = [];
	// folderPromises.push(promiseFolderAdded(parentFolderName));
	top.createSubfolder(parentFolderName, msgWindow);
	// await Promise.all(folderPromises);

	var tempfolder2 = top.getChildNamed(parentFolderName);
	tempfolder2 = tempfolder2.QueryInterface(Ci.nsIMsgLocalMailFolder);
	parent = tempfolder2;
	return tempfolder2;

}



function sleepA(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Folder listener to resolve a promise when a folder with a certain
 * name is added.
 *
 * @param name     folder name to listen for
 * @return         promise{folder} that resolves with the new folder when the
 *                 folder add completes
 */

function promiseFolderAdded(folderName) {
	return new Promise((resolve, reject) => {
		var listener = {
			folderAdded: aFolder => {
				if (aFolder.name == folderName) {
					MailServices.mfn.removeListener(listener);
					resolve(aFolder);
				}
			},
		};
		MailServices.mfn.addListener(
			listener,
			Ci.nsIMsgFolderNotificationService.folderAdded
		);
	});
}

function dirWalk(dir) {

	// allfiles is the nsiSimpleEnumerator with the files in the directory selected from the filepicker
	var allfiles = dir.directoryEntries;
	var allDirs = [];

	while (allfiles.hasMoreElements()) {
		var afile = allfiles.getNext();
		afile = afile.QueryInterface(Ci.nsIFile);

		try {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=701721 ?
			var is_Dir = afile.isDirectory();
		} catch (e) {
			console.debug(e);
		}
		if (is_Dir) {
			allDirs.push(afile.path);

			let subfiles = dirWalk(afile);
			allDirs = allDirs.concat(subfiles);
			// console.debug('all ');
			// console.debug(allDirs);
		}
	}
	return allDirs;

}

