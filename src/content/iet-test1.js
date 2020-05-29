// folder tests

// top-level menu options


var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");

var msgfolderArray = [];
var folderArray = [];
var msgCount = 0;

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

	// var dirs = dirWalk(osFolder.file);
	var dirs = await dirWalk2(osFolder.file.path);
	console.debug('AfterWalk');
	for (let index = 0; index < dirs.length; index++) {
		const element = dirs[index];
		console.debug(element.path.length + ' : ' + element.path);

	}
	// return;
	var test_cycles = Preferences.get("extensions.iet-ng-tests.test_cycles").value;
	console.debug(test_cycles);

	for (let index = 0; index < test_cycles; index++) {
		createFolderStructure(osFolder, osFolder.file.path, msgFolder, dirs);
		if (test_cycles > 1) {
			await resetSelectedFolder(msgFolder);
		}
	}
}

async function ImportEMLStructuredExt() {
	msgCount = 0;
	let msgFolder = GetSelectedMsgFolders()[0];

	var osFolder = promptImportDirectory();

	let startTime = new Date();

	var dirs = await getImportFolderStructure(osFolder.file.path);
	console.debug('OS Folders:');
	for (let index = 0; index < dirs.length; index++) {
		const element = dirs[index];
		console.debug(element.path.length + ' : ' + element.path);
	}
	// return;
	var test_cycles = Preferences.get("extensions.iet-ng-tests.test_cycles").value;
	// console.debug(test_cycles);

	createFolderStructure(osFolder, osFolder.file.path, msgFolder, dirs);

	// for (let index = 0; index < folderArray.length; index++) {
	// 	const element = folderArray[index];
	// 	console.debug(element);
	// }

	await importOSFolderMessages(msgFolder, msgfolderArray, dirs);
	let stepTime = new Date();
	console.debug('Total Messages Imported: ' + msgCount);
	console.debug('Import ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');
	IETwritestatus('Total Messages Imported: ' + msgCount + '  -  ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec', 0);


}

function createFolderStructure(osFolder, rootOSFolder, msgFolder, dirs) {
	let startTime = new Date();

	var curParentFolder = null;

	// console.debug(rootOSFolder);
	folderArray = dirs.map(d => {
		let da;
		if (navigator.platform.toLowerCase().indexOf("win") > -1) {
			da = d.path.split(rootOSFolder + '\\')[1];
			if (!da) {
				da = rootOSFolder;
			}
		} else {
			da = d.path.split(rootOSFolder + '/')[1];
		}
		return da;
	});
	console.debug('Folder Array');
	folderArray.map(d => {
		console.debug(d);
	});

	// folderArray.unshift(rootOSFolder);
	msgfolderArray[0] = msgFolder;

	for (let index = 1; index < folderArray.length; index++) {
		if (index % 400 === 0) {
			msgFolder.ForceDBClosed();
			console.debug('update');
		}

		let newFolderName = OS.Path.basename(folderArray[index]);
		let OSDirPath = OS.Path.dirname(folderArray[index]);

		try {
			if (OSDirPath === '.') {
				curParentFolder = msgFolder;
				curParentFolder.createSubfolder(newFolderName, msgWindow);
				// console.debug('created: '+ newFo.lderName);
				msgfolderArray[index] = curParentFolder.getChildNamed(newFolderName);
			} else {
				curParentFolder = msgfolderArray[folderArray.indexOf(OSDirPath)];
				curParentFolder.createSubfolder(newFolderName, msgWindow);
				// console.debug('created subfolder: '+ newFolderName);
				msgfolderArray[index] = curParentFolder.getChildNamed(newFolderName);
			}

		} catch (error) {
			console.debug('Error ' + error);
			console.debug(newFolderName);
		}

	}
	let stepTime = new Date();
	console.debug('CreateFolders ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');

}

async function importOSFolderMessages(msgFolder, msgfolderArray, OSFolderArray) {
	// console.debug('ImportantMessages');
	await messageFolderImport(msgFolder, msgfolderArray[0], folderArray[0]);

	// msgFolder.ForceDBClosed();
	// msgFolder.updateFolder(msgWindow);

	for (let index = 1; index < OSFolderArray.length; index++) {
		const folder = OSFolderArray[index].path;
		// console.debug('ImportFolder ' + folder);
		await messageFolderImport(msgFolder, msgfolderArray[index], folder);

		// console.debug('AfterFolder DB close /update ' + msgfolderArray[index].name);
		// msgFolder.ForceDBClosed();
		// msgfolderArray[index].updateFolder(msgWindow);
		// msgfolderArray[index].parent.updateFolder(msgWindow);


	}
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

				if (test_usecfawait && (i % pawaitCycle === 0 && pawaitCycle || (i % updateCycle === 0 && updateCycle))) {
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

async function dirWalk2(dirPath) {
	var iterator = new OS.File.DirectoryIterator(dirPath);
	var subdirs = [{ path: dirPath }];

	// Iterate through the directory
	let p = iterator.forEach(
		function onEntry(entry) {
			if (entry.isDir) {
				// console.debug(entry.name);
				// console.debug(entry.path);
				subdirs.push(entry);
				// subdirs.push(entry.path);
			} else {
				// console.debug('file  ' + entry.name);
			}
		}
	);

	return p.then(
		async function onSuccess() {
			iterator.close();
			// console.debug('dirs: ' + subdirs.map(d => d.name + ' '));

			for (const dir of subdirs) {
				// console.debug('subWalk '+ dir.name);
				let dirs = await dirWalk2(dir.path);
				subdirs = subdirs.concat(dirs);
				// console.debug('accumulated dirs: ' + subdirs.map(d => d.name + ' '));
			}

			return subdirs;
		},
		function onFailure(reason) {
			iterator.close();
			throw reason;
		}
	);

}

async function getImportFolderStructure(rootDirPath) {
	let baseDirs = await importOSDirIteration(rootDirPath);
	baseDirs.unshift({ path: rootDirPath });
	return baseDirs;
}

async function importOSDirIteration(rootDirPath) {
	var iterator = new OS.File.DirectoryIterator(rootDirPath);
	var subdirs = [];

	// console.debug('importIteration ' + rootDirPath);
	// Iterate through the directory
	let p = iterator.forEach(
		function onEntry(entry) {
			if (entry.isDir) {
				// console.debug(entry.name);
				// console.debug(entry.path);
				subdirs.push(entry);
				// subdirs.push(entry.path);
			} else {
				// console.debug('file  ' + entry.name);
			}
		}
	);

	return p.then(
		async function onSuccess() {
			iterator.close();
			// console.debug('dirs: ' + subdirs.map(d => d.path + ' '));

			for (const dir of subdirs) {
				// console.debug('subWalk '+ dir.name);
				let dirs = await importOSDirIteration(dir.path);
				subdirs = subdirs.concat(dirs);
				// console.debug('accumulated dirs: ' + subdirs.map(d => d.name + ' '));
			}

			// subdirs.unshift({path: rootDirPath});
			return subdirs;
		},
		function onFailure(reason) {
			iterator.close();
			throw reason;
		}
	);

}


async function messageFolderImport(rootFolder, msgFolder, dirPath) {
	var iterator = new OS.File.DirectoryIterator(dirPath);
	var messageEntries = [];
	var fileArray = "";
	var test_updateCycle = Preferences.get("extensions.iet-ng-tests.test_updatecycle").value;
	var test_updateCount = Preferences.get("extensions.iet-ng-tests.test_updatecount").value;
	var test_pawaitCycle = Preferences.get("extensions.iet-ng-tests.test_pawaitcycle").value;
	var test_usecfawait = Preferences.get("extensions.iet-ng-tests.test_usecfawait").value;

	msgFolder = msgFolder.QueryInterface(Ci.nsIMsgLocalMailFolder);

	// console.debug('Folder ' + msgFolder.name);
	// Iterate through the directory
	let p = iterator.forEach(
		async function onEntry(entry) {

			try {
				if (!entry.isDir) {
					if (msgCount++ % test_updateCycle === 0 && Preferences.get("extensions.iet-ng-tests.test_message_loop_dbclose").value) {
						try {
							rootFolder.ForceDBClosed();
							if (test_usecfawait) {
								msgFolder.parent.updateFolder(msgWindow);
								console.debug('message update folder');
							}
							console.debug('MessageLoop DB update');

						} catch (error) {
							console.debug('Message DB Exception ' + msgCount);
							console.debug(error);
						}
					}

					// console.debug(entry.name);
					// console.debug(msgCount + '  : ' + entry.path);
					if (entry.name.endsWith(".eml")) {
						fileArray = await readFile1(entry.path);
						fileArray = fixFile(fileArray, msgFolder, entry.name);
						try {
							// console.debug('Adding ' + msgCount);
							msgFolder.addMessage(fileArray);
							// console.debug('Added ' + entry.path);
							if (msgCount % 10 === 0) {
								IETwritestatus('Messages Imported: ' + msgCount);
							}
						} catch (e) {
							console.debug(msgCount + '  AdMessageError ' + e);
							console.debug(entry.path);
						}
						// messageEntries.push(entry);

					} else {
						console.debug('Skip Non-EML File: ' + entry.path + ' - ' + entry.name);
					}
					// console.debug(fileArray);
				} else {
					// console.debug('folder entry  ' + entry.name);
				}
			} catch (e) {
				console.debug('EntryException ' + e);
				throw (e);
			}
		}
	);

	return p.then(
		async function onSuccess() {
			iterator.close();
			// console.debug('IteratorSuccess');
			return;
		},
		function onFailure(reason) {
			iterator.close();
			throw reason;
		}
	);


}

async function readFile1(filePath) {

	let decoder = new TextDecoder();        // This decoder can be reused for several reads
	let promise = OS.File.read(filePath); // Read the complete file as an array
	promise = promise.then(
		function onSuccess(array) {

			// console.debug('file okay ');
			// console.debug('Size ' + array.length);
			return decoder.decode(array);        // Convert this array to a text
		},

		function onRejected(reason) {
			console.debug('FileRead Error: ' + reason);
			return (reason);
		}
	);
	return promise;
}


function fixFile(data, msgFolder, file) {
	// Fix and transform data

	// var msgFolder = GetSelectedMsgFolders()[0];
	// msgFolder = msgFolder.QueryInterface(Ci.nsIMsgLocalMailFolder);

	// strip off the null characters, that break totally import and display
	data = data.replace(/\x00/g, "");
	var now = new Date;
	var nowString;

	try {
		nowString = now.toString().match(/.+:\d\d/);
		nowString = nowString.toString().replace(/\d{4} /, "");
		nowString = nowString + " " + now.getFullYear();
	} catch (e) {
		nowString = now.toString().replace(/GMT.+/, "");
	}

	var top = data.substring(0, 2000);

	// Fix for crazy format returned by Hotmail view-source
	if (top.match(/X-Message-Delivery:.+\r?\n\r?\n/) || top.match(/X-Message-Info:.+\r?\n\r?\n/))
		data = data.replace(/(\r?\n\r?\n)/g, "\n");

	// Fix for some not-compliant date headers
	if (top.match(/Posted-Date\:/))
		data = data.replace("Posted-Date:", "Date:");
	if (top.match(/X-OriginalArrivalTime:.+\r?\n\r?\n/))
		data = data.replace("X-OriginalArrivalTime:", "Date:");

	// Some eml files begin with "From <something>"
	// This causes that Thunderbird will not handle properly the message
	// so in this case the first line is deleted
	data = data.replace(/^From\s+.+\r?\n/, "");

	// Prologue needed to add the message to the folder
	var prologue = "From - " + nowString + "\n"; // The first line must begin with "From -", the following is not important
	// If the message has no X-Mozilla-Status, we add them to it
	// cleidigh - correct logic conversion
	if (!data.includes("X-Mozilla-Status"))
		prologue = prologue + "X-Mozilla-Status: 0000\nX-Mozilla-Status2: 00000000\n";
	else {
		// else if (IETprefs.getBoolPref("extensions.importexporttoolsng.reset_mozilla_status")) {
		// Reset the X-Mozilla status
		data = data.replace(/X-Mozilla-Status: \d{4}/, "X-Mozilla-Status: 0000");
		data = data.replace(/X-Mozilla-Status2: \d{8}/, "X-Mozilla-Status2: 00000000");
	}
	// If the message has no X-Account-Key, we add it to it, taking it from the account selected
	// cleidigh - correct logic conversion
	if (!data.includes("X-Account-Key")) {
		var myAccountManager = Cc["@mozilla.org/messenger/account-manager;1"]
			.getService(Ci.nsIMsgAccountManager);
		var myAccount = myAccountManager.FindAccountForServer(msgFolder.server);
		prologue = prologue + "X-Account-Key: " + myAccount.key + "\n";
	}

	// fix this cleidigh
	data = escapeBeginningFrom(data, file);
	// Add the prologue to the EML text
	data = prologue + data + "\n";

	return data;
}

