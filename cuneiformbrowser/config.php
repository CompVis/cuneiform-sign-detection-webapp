<?php
	/* This file should just contain all important variables
	 * Paths, etc.
	 */

	//define('_IMAGESPATH_', "matlab/images".DIRECTORY_SEPARATOR);


	//define('_IMAGESLIST_', _IMAGESPATH_."imagesList.xml");
	define('_LOGPATH_',"log".DIRECTORY_SEPARATOR);
	define('_LOGFILE_',_LOGPATH_."webinterfacelog.log");
	define('_USERDATA_',"users".DIRECTORY_SEPARATOR);
	define('_USERS_',"users".DIRECTORY_SEPARATOR);
    define('_USERSLIST_',_USERS_."users.xml");
//	define('_MATLABCOM_',"matlab".DIRECTORY_SEPARATOR."matlabcom".DIRECTORY_SEPARATOR);
//	define('_MATLABPATH_',"matlab".DIRECTORY_SEPARATOR);
//	define('_MATLABCALL_',"something");
	define('_MATLABCOM_',"");
	define('_MATLABPATH_',"");
	define('_MATLABCALL_',"");
	//define('_ANNOTATIONS_',_IMAGESPATH_."annotations".DIRECTORY_SEPARATOR);
	//define('_BACKUPSPATH_',_ANNOTATIONS_."backup".DIRECTORY_SEPARATOR);
	define('_RESULTS_',_MATLABPATH_."resultsWeb".DIRECTORY_SEPARATOR);
	//define('_FALSEPOSITIVES_',_MATLABPATH_."fp_files".DIRECTORY_SEPARATOR); $_SESSION['groupFolder'].'fb_files'.DIRECTORY_SEPARATOR
	/* Some small combinations to avoid playing with the strings */
	define('_PAGESIZE_',10);

?>
