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
	var test_pawaitCycle = Preferences.get("extensions.iet-ng-tests.test_pawaitcycle").value;
	// test_ = Preferences.get("extensions.iet-ng-tests.test_");
	// test_ = Preferences.get("extensions.iet-ng-tests.test_");

	let folderArray = createFolders(msgFolder, test_cycles, test_fcount, test_mcount, test_msize, test_updateCycle, test_pawaitCycle);

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

function createFolderStructure2(osFolder, rootOSFolder, msgFolder, dirs) {
	let startTime = new Date();
	var curParentFolder = null;
	var curFolder = "";
	var msgfolderArray = [];

	console.debug(rootOSFolder);
	var folderArray = dirs.map(d => {
		let da = d.split(rootOSFolder)[1];
		console.debug(da);
		return da;
	});
	console.debug(folderArray);

	for (let index = 0; index < folderArray.length; index++) {
		if (index % 400 === 0) {
			msgFolder.ForceDBClosed();
			console.debug('update');
		}
		let fsplit = folderArray[index].split('\\');
		console.debug('split ');
		fsplit.shift();

		console.debug(fsplit);
		if (fsplit.length === 1) {
			curParentFolder = msgFolder;
			curFolder = folderArray[index].slice(1);
			curParentFolder.createSubfolder(curFolder, msgWindow);
			console.debug('created: ' + curFolder);
			msgfolderArray[index] = curParentFolder.getChildNamed(curFolder);
		} else {
			console.debug(fsplit.slice(0, fsplit.length - 1));
			console.debug(fsplit.slice(0, fsplit.length - 1).join('\\'));


			let pi = folderArray.indexOf('\\' + fsplit.slice(0, fsplit.length - 1).join("\\"));
			console.debug('Parent ' + pi + '  ' + folderArray[pi] + '  ' + fsplit[fsplit.length - 1]);
			curParentFolder = msgfolderArray[pi];
			curFolder = fsplit[fsplit.length - 1];
			curParentFolder.createSubfolder(curFolder, msgWindow);
			console.debug('created subfolder: ' + curFolder);
			msgfolderArray[index] = curParentFolder.getChildNamed(curFolder);
		}
		// curParentFolder.createSubfolder(curFolder, msgWindow);
		console.debug(curFolder);
	}
	let stepTime = new Date();
	console.debug('CreateFolders ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');


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

async function createFolders(parent, cycles, fcount, mcount, msize, updateCycle, pawaitCycle) {
	let count2 = cycles;
	var count = fcount;

	var mCountTotal = 0;
	var delay = 60;

	// count : # folders
	// count2 : test cycles
	// mcount : # messages per folder
	// msize : size in bytes
	//  var msize = 10000;

	/* 
	for (let index = 0; index < msize / 100; index++) {
		msg1 += msg100ch;
	}
	msg1 += "\n\n";
 */

	console.debug('CreateFolders Test1 - Start Cycles: ' + count2 + ' Folders: ' + count + ' MsgPerFolder: ' + mcount + ' MsgSize: ' + msize);


	let afileBase = "-subfolder";
	let folderName = "";

	// var sleepTime = Preferences.get("extensions.iet-ng-tests.test_msize").value;

	for (let i2 = 1; i2 < count2 + 1; i2++) {
		var fDBClosedCount = Preferences.get("extensions.iet-ng-tests.test_msize").value;

		let startTime = new Date();
		console.debug('Time: ' + startTime.toISOString());

		var i = 0;
		try {
			const folderPromises = [];
			for (i = 1; i < count + 1; i++) {
				folderName = `${i}${afileBase}`;
				// folderPromises.push(promiseFolderAdded(folderName));
				parent.createSubfolder(folderName, msgWindow);
				if (i % pawaitCycle === 0 && pawaitCycle || (i % updateCycle === 0 && updateCycle)) {
					await Promise.all(folderPromises);
					console.debug('Created Folder/await : ' + i2 + ' :  ' + i);
				}

				if (i % updateCycle === 0 && updateCycle && fDBClosedCount) {
					parent.ForceDBClosed();
					fDBClosedCount--;
					// await sleepA(sleepTime);
					console.debug('Update : ' + i + ' : ' + folderName);
				}


				// if (i % 1 === 0 && mcount > 0) {
				// 	// if (i % 1 === 0) {
				// 	// if (i % 4000 == 0 && i !== 0) {
				// 	// console.debug('adding message ' + parent.name);
				// 	await sleepA(5);
				// 	var tempfolder = parent.getChildNamed(folderName);
				// 	tempfolder = tempfolder.QueryInterface(Ci.nsIMsgFolder);

				// 	// parent.updateFolder(msgWindow);
				// 	addMessages(tempfolder, mcount, msize);
				// 	mCountTotal += mcount;
				// 	IETwritestatus('Cycle: ' + i2 + '  Folder: ' + folderName + ' : ' + mCountTotal)
				// 	// parent.updateFolder(msgWindow);
				// 	// console.debug('waiting over');
				// }

				let stepTime2 = new Date();
				// IETwritestatus('Folder Cycle: ' + i2 + '  Folder: ' + folderName + '  Time ' + stepTime2);
			}
		} catch (e) {
			console.debug(e + " : count = " + i);
			alert(e + " : count = " + i);
			return;
		}

		let stepTime = new Date();
		console.debug('CreateFolders ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');
		IETwritestatus('Folder Cycle: ' + i2 + '  Folder: ' + folderName + '  Time ' + (stepTime - startTime) / 1000 + ' sec');
		// console.debug('wait clear subfolders');
		await sleepA(500);

		await resetSelectedFolder(parent);
		console.debug('AfterReset');
		continue;

		let MSG_FOLDER_FLAG_DIRECTORY = 0x0008;
		let top = parent.parent;
		let parentFolderName = parent.name;

		let targets = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);

		targets.appendElement(parent, false);

		top.deleteSubFolders(targets, null);

		top.ForceDBClosed();
		// top.updateFolder(msgWindow);

		let endTime = new Date();
		console.debug('Cycle: ' + i2 + ' Time End: ' + (endTime - startTime) / 1000);
		console.debug('TotalMessages: ' + mCountTotal);
		await sleepA(500);

		let folderPromises = [];
		folderPromises.push(promiseFolderAdded(parentFolderName));
		top.createSubfolder(parentFolderName, msgWindow);
		await Promise.all(folderPromises);

		var tempfolder2 = top.getChildNamed(parentFolderName);
		tempfolder2 = tempfolder2.QueryInterface(Ci.nsIMsgFolder);
		parent = tempfolder2;
		console.debug(parent.name);
		await sleepA(1500);

	}

	console.debug('Done');
}


async function resetSelectedFolder(folder) {
	// console.debug('wait clear subfolders');

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
					// console.debug('completed : ' + folderName);
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
};

function promiseFolderMsgAdded(folderName) {
	return new Promise((resolve, reject) => {
		var listener = {
			msgAdded: aMsg => {
				console.debug('Message completed : ');
				MailServices.mfn.removeListener(listener);
				resolve(aMsg);
			},
		};

		MailServices.mfn.addListener(
			listener,
			Ci.nsIMsgFolderNotificationService.msgAdded
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

