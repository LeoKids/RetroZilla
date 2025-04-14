// this function verifies disk space in kilobytes
function verifyDiskSpace(dirPath, spaceRequired)
{
  var spaceAvailable;

  // Get the available disk space on the given path
  spaceAvailable = fileGetDiskSpaceAvailable(dirPath);

  // Convert the available disk space into kilobytes
  spaceAvailable = parseInt(spaceAvailable / 1024);

  // do the verification
  if(spaceAvailable < spaceRequired)
  {
    logComment("Insufficient disk space: " + dirPath);
    logComment("  required : " + spaceRequired + " K");
    logComment("  available: " + spaceAvailable + " K");
    return(false);
  }

  return(true);
}

// this function deletes a file if it exists
function deleteThisFile(dirKey, file)
{
  var fFileToDelete;

  fFileToDelete = getFolder(dirKey, file);
  logComment("File to delete: " + fFileToDelete);
  if(File.isFile(fFileToDelete))
  {
    File.remove(fFileToDelete);
    return(true);
  }
  else
    return(false);
}

// this function deletes a folder if it exists
function deleteThisFolder(dirKey, folder, recursiveDelete)
{
  var fToDelete;

  if(typeof recursiveDelete == "undefined")
    recursiveDelete = true;

  fToDelete = getFolder(dirKey, folder);
  logComment("folder to delete: " + fToDelete);
  if(File.isDirectory(fToDelete))
  {
    File.dirRemove(fToDelete, recursiveDelete);
    return(true);
  }
  else
    return(false);
}

// OS type detection
// which platform?
function getPlatform()
{
  var platformStr;
  var platformNode;

  if('platform' in Install)
  {
    platformStr = new String(Install.platform);

    if (!platformStr.search(/^Macintosh/))
      platformNode = 'mac';
    else if (!platformStr.search(/^Win/))
      platformNode = 'win';
    else if (!platformStr.search(/^OS\/2/))
      platformNode = 'win';
    else
      platformNode = 'unix';
  }
  else
  {
    var fOSMac  = getFolder("Mac System");
    var fOSWin  = getFolder("Win System");

    logComment("fOSMac: "  + fOSMac);
    logComment("fOSWin: "  + fOSWin);

    if(fOSMac != null)
      platformNode = 'mac';
    else if(fOSWin != null)
      platformNode = 'win';
    else
      platformNode = 'unix';
  }

  return platformNode;
}

function upgradeCleanup()
{
  deleteThisFile("Program",    "zlib.dll");
  deleteThisFile("Program",    "component.reg");
  deleteThisFile("Components", "compreg.dat");
  deleteThisFile("Components", "xpti.dat");
  deleteThisFile("Components", "xptitemp.dat");
}

// main
var srDest;
var err;
var szUninstall;
var fProgram;
var fWindowsSystem;
var fileComponentReg;
var fileComponentRegStr;
var fileMsvcrt;
var fileMsvcirt;

srDest = 1;
err    = initInstall("Mozilla XPCOM", "XPCOM", "2.3.0.0000000000"); 
logComment("initInstall: " + err);

fProgram  = getFolder("Program");
fWindowsSystem = getFolder("Win System");
logComment("fProgram: " + fProgram);

// build the uninstall folder path
szUninstall = fProgram + "Uninstall";

// Log component.reg file so it can be deleted by the uninstaller.
// These two files are created after installation is done, thus
// are normally not logged for uninstall.
logComment("Installing: " + fProgram + "component.reg");

if(verifyDiskSpace(fProgram, srDest))
{
  setPackageFolder(fProgram);

  upgradeCleanup();
  err = addDirectory("",
                     "2.3.0.0000000000",
                     "bin",              // dir name in jar to extract 
                     fProgram,           // Where to put this file (Returned from GetFolder) 
                     "",                 // subdir name to create relative to fProgram
                     true);              // Force Flag 
  logComment("addDirectory() of Program returned: " + err);

  if( err == SUCCESS )
  {
    // install msvcrt.dll *only* if it does not exist
    // we don't care if addFile() fails (if the file does not exist in the archive)
    // bacause it will still install
    fileMsvcrt = getFolder(fWindowsSystem, "msvcrt.dll");
    rv         = File.exists(fileMsvcrt);
    logComment("fileExists() returned: " + rv);
    if(rv == false)
    {
      logComment("File not found: " + fileMsvcrt);
      addFile("/Microsoft/Shared/msvcrt.dll",
              "2.3.0.0000000000",
              "msvcrt.dll",         // dir name in jar to extract 
              fWindowsSystem,       // Where to put this file (Returned from getFolder) 
              "",                   // subdir name to create relative to fProgram
              WIN_SHARED_FILE);
      logComment("addFile() of msvcrt.dll returned: " + err);
    }
    else
    {
      logComment("File found: " + fileMsvcrt);
    }

    // install msvcirt.dll *only* if it does not exist
    // we don't care if addFile() fails (if the file does not exist in the archive)
    // bacause it will still install
    fileMsvcirt = getFolder(fWindowsSystem, "msvcirt.dll");
    rv          = File.exists(fileMsvcirt);
    logComment("fileExists() returned: " + rv);
    if(rv == false)
    {
      logComment("File not found: " + fileMsvcirt);
      addFile("/Microsoft/Shared/msvcirt.dll",
              "2.3.0.0000000000",
              "msvcirt.dll",        // dir name in jar to extract 
              fWindowsSystem,       // Where to put this file (Returned from getFolder) 
              "",                   // subdir name to create relative to fProgram
              WIN_SHARED_FILE);
      logComment("addFile() of msvcirt.dll returned: " + err);
    }
    else
    {
      logComment("File found: " + fileMsvcirt);
    }
  }

  // check return value
  if( err == SUCCESS )
  {
    err = performInstall(); 
    logComment("performInstall() returned: " + err);
  }
  else
    cancelInstall(err);
}
else
  cancelInstall(INSUFFICIENT_DISK_SPACE);


// end main

