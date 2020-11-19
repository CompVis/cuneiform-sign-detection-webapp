<?php

if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if($_SESSION['cuneidemo']["enabled"] != true) {
	echo "nope!";
	exit();
}
include_once ('config.php'); // Needed for the different Folders

$DS = DIRECTORY_SEPARATOR;

if(!isset($_GET['infoRequest'])) {
	if(!isset($_GET['cleanup'])) {
		echo "Bad request" . _MATLABCOM_ . $_SESSION['cuneidemo']['imageName'];
		exit();
	}
}
switch ($_GET['infoRequest']) {
	case "available_versions" :
		$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
		$imageID = intval($_SESSION['cuneidemo']['imageID']);
		$name = $xmlImages->image[$imageID]->file;

		$base_directory = './'.$_SESSION['cuneidemo']["performance"].'fullResults'.$DS;   // '../../'

		$all_folders = glob($base_directory.'v*');

		$info = [];

		foreach($all_folders as $folder)
		{
	//		$number = intval(array_filter(explode('v', basename($folder)))[1]);

			$search_file = glob($base_directory.basename($folder).$DS.$_SESSION['cuneidemo']['collectionFolderName'].$name.'*.csv');

			if(!empty($search_file))
			{
//				$info[] = [$number, sprintf("v%03d", $number)];
				$parts = explode("_", basename($folder), 2);
				if(count($parts) == 1)
					$info[] = [basename($folder), "Tobias' fancy versioning system"];
				else
					$info[] = [basename($folder), $parts[1]];
					
				//$info[] = [basename($folder), "Tobias' fancy versioning system"];
			}
		}
		echo json_encode($info);
		break;
}



?>
