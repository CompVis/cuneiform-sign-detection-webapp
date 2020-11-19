<?php

if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if($_SESSION['cuneidemo']["enabled"] != true) {
	echo "nope!";
	exit();
}
include_once ('config.php'); // Needed for the different Folders
include_once ('logger.php');
// this will send some relevant information to the client.

if(isset($_POST['action'])) {
	deleteImage();
	exit();
}
if(!isset($_GET['infoRequest'])) {
	if(!isset($_GET['cleanup'])) {
		echo "Bad request" . _MATLABCOM_ . $_SESSION['cuneidemo']['imageName'];
		exit();
	}
}
switch ($_GET['infoRequest']) {
	case "test" :
		testing();
		break;
	case "dictionary" :
		if(file_exists($_SESSION['cuneidemo']['groupFolder'] . "dictionary.json"))
			echo file_get_contents($_SESSION['cuneidemo']['groupFolder'] . "dictionary.json");
		else {
			$emptyJSON = "{}";
			echo $emptyJSON;

			$file = fopen($_SESSION['cuneidemo']['groupFolder'] . "dictionary.json", 'w');
			fwrite($file, $emptyJSON);
			fclose($file);
			logMessage("New dictionary created in ".$_SESSION['cuneidemo']['groupName']);
		}
		break;
	case "modelList" : // Available models for detection
		echo json_encode(getAllModels());
		exit();
		break;
	case "process" : // TODO Needed?
		echo json_encode(startingCheck());
		break;
	case "processContinue" : // TODO needed?
		$temp = startingCheck();
		$_SESSION['cuneidemo']['continueProcess'] = true;
		echo json_encode($temp['data']);
		break;
	case "prepareBackup" : // For trainer.js -> calling to load backup.
		$backupCorrections = fopen(_USERS_ . $_SESSION['cuneidemo']['user'] . '_backupDetection.txt', 'rb');
		$jsonData = json_decode(trim(fgets($backupCorrections)), true);
		// $id = trim(fgets($backupCorrections));
		$_SESSION['cuneidemo']['loadBackup'] = true;
		echo json_encode(array(
				'imageID' => $jsonData['imageID'],
				'groupID' => $jsonData['group'],
				'collectionID' => (int) $jsonData['collection']
		));
		break;
	case "prepareTrainingFeed" :
		// If the session was closed, most of the information has to be re-loaded.
		$file = fopen(_USERDATA_ . $_SESSION['cuneidemo']['user'] . "process.txt", 'r');

		if($file == FALSE) {
			echo json_encode(array(
					'error' => true
			));
			break;
		}
		fgets($files); // first line is just TRAINING
		$_SESSION['cuneidemo']['verboseFile'] = fgets($files); // Second line is the info!
		fclose($file);
		$_SESSION['cuneidemo']["lineIndex"] = 0; // reset the indices!!!
		$_SESSION['cuneidemo']["verboseIndex"] = 0;
		echo json_encode(array(
				'error' => false
		));
		break;
	case "currentInfo" :

		if(file_exists(_USERS_ . $_SESSION['cuneidemo']['user'] . '_backupDetection.txt')) {
			$backupCorrections = fopen(_USERS_ . $_SESSION['cuneidemo']['user'] . '_backupDetection.txt', 'rb');
			$id = trim(fgets($backupCorrections));
			$backup = true;
		} else {
			$backup = false;
			$id = 0;
		}
		$process = startingCheck();
		$options = imageOptions();

		/* 'imageID'=> $_SESSION['cuneidemo']['imageID'],'imageName'=>$_SESSION['cuneidemo']['imageName'], */
		echo json_encode(array(
				'backup' => $backup,
				'autoload' => $_SESSION['cuneidemo']['autoload']/*DOUBLE*/,
							   'loadBackup' => $_SESSION['cuneidemo']['loadBackup'],
				'backupID' => (int) $id,
				'algorithms' => getAlgorithms('none'),
				'process' => $process['process'],
				'processData' => $process,
				'continueProcess' => $_SESSION['cuneidemo']['continueProcess'],
				'detectionOptions' => imageOptions()
		));
		break;
	case "algorithms" :
		echo json_encode(getAlgorithms($_GET['options']));
		break;

	case "startUp" :
		echo json_encode(startUpInfo());
		break;
	case "annotations" :
		$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
		$available = array();
		foreach($xmlImages->image as $imageInfo) {
			$name = $imageInfo->name;
			$statusAnnotations = $imageInfo->annotation['info'];
			if("$statusAnnotations" == "done") {
				$available[] = (string) $name;
			}
		}
		$archiveJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder'] . "archivedAnnotations.json");
		echo $archiveJSON;
		break;
	case "groups" :
		echo file_get_contents(_MATLABPATH_ . "data/dataconfig.json");
		break;
	case "collections" :
		echo file_get_contents($_SESSION['cuneidemo']['groupFolder'] . "archivedAnnotations.json");
		break;
	case "setCollection" :
		if(isset($_GET["collection"]) && isset($_GET["group"])) {
			// $xmlData = simplexml_load_file('data/dataconfig.xml');
			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'), true);
			$_SESSION['cuneidemo']['collection'] = $_GET['collection'];
			$_SESSION['cuneidemo']['group'] = $_GET['group'];

			$groupFolder = $dataconfig["groups"][intval($_GET['group'])]["groupFolder"];
			// $groupFolder = $xmlData->group[intval($_GET['group'])]->folder.DIRECTORY_SEPARATOR;

			// $collection = $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->folder.DIRECTORY_SEPARATOR;
			$collection = $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionFolder"];
			$_SESSION['cuneidemo']['collectionFolder'] = 'data/' . $groupFolder . $collection;
			$_SESSION['cuneidemo']['imagesPath'] = 'data/' . $groupFolder . $collection . 'images' . DIRECTORY_SEPARATOR;
			// $_SESSION['cuneidemo']['imagesPath'] = 'data/'.$groupFolder.$collection;
			$_SESSION['cuneidemo']['imagesList'] = 'data/' . $groupFolder . $collection . 'imagesList.xml';
			$_SESSION['cuneidemo']['annotationsPath'] = 'data/' . $groupFolder . $collection . 'annotations' . DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['groupModels'] = 'data/' . $groupFolder . 'models/';
			$_SESSION['cuneidemo']['groupFolder'] = 'data/' . $groupFolder;

			// $_SESSION['cuneidemo']['groupName'] = (string) $xmlData->group[intval($_GET['group'])]->name;
			$_SESSION['cuneidemo']['groupName'] = $dataconfig["groups"][intval($_GET['group'])]["groupName"];

			// $_SESSION['cuneidemo']['collectionName'] = (string) $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->name;
			$_SESSION['cuneidemo']['collectionName'] = $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionName"];
			$_SESSION['cuneidemo']["performance"] = $_SESSION['cuneidemo']['groupFolder'] . "performance" . DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['collectionFolderName'] = $collection;
		}
		break;

	case "collectionPages" :
		$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
		$pages = (string) ceil($xmlImages->total / _PAGESIZE_);
		echo "{\"pages\":$pages}";
		break;

	// TODO:
	case "setGroup" :
		if(isset($_GET["group"])) {
			// $xmlData = simplexml_load_file('data/dataconfig.xml');
			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'), true);
			$_SESSION['cuneidemo']['group'] = $_GET['group'];

			$groupFolder = $dataconfig["groups"][intval($_GET['group'])]["groupFolder"];
			// $groupFolder = $xmlData->group[intval($_GET['group'])]->folder.DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['groupModels'] = 'data/' . $groupFolder . 'models/';
			$_SESSION['cuneidemo']['groupFolder'] = 'data/' . $groupFolder;

			// $_SESSION['cuneidemo']['groupName'] = (string) $xmlData->group[intval($_GET['group'])]->name;
			$_SESSION['cuneidemo']['groupName'] = $dataconfig["groups"][intval($_GET['group'])]["groupName"];
			$_SESSION['cuneidemo']["performance"] = $_SESSION['cuneidemo']['groupFolder'] . "performance" . DIRECTORY_SEPARATOR;
		} else
			echo json_encode(Array(
					"error" => true
			));
		break;

	case "newGroup" :
		if(isset($_GET["newName"]) && isset($_GET['shortName'])) {
			$short = str_replace(' ', '', $_GET['shortName']);
			if(!ctype_alnum(str_replace(' ', '', $_GET['newName'])) || !ctype_alnum($short)) {
				// Name not alphanumeric!!
				echo json_encode(Array(
						"error" => true,
						"type" => "Bad name!",
						"short" => $short,
						"long" => $_GET["newName"]
				));
				break;
			}

			$path = 'matlab' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . $short;

			mkdir($path . DIRECTORY_SEPARATOR . "models" . DIRECTORY_SEPARATOR . "modelThumb", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "models" . DIRECTORY_SEPARATOR . "examples", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . "fullFeedback", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . "fullResults", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . "statsGeneral", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . "statsImages", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . "statsModels", 0777, true);

			// TODO: empty dictionary, archived anno, meta, fp-list <- Check if automatically created!!!

			copy('lib' . DIRECTORY_SEPARATOR . 'dictionary.json', $path . DIRECTORY_SEPARATOR . 'dictionary.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'archivedAnnotations.json', $path . DIRECTORY_SEPARATOR . 'archivedAnnotations.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'fp_list.json', $path . DIRECTORY_SEPARATOR . 'fp_list.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'meta.cfg', $path . DIRECTORY_SEPARATOR . 'meta.cfg');
			copy('lib' . DIRECTORY_SEPARATOR . 'examplesList.json', $path . DIRECTORY_SEPARATOR . "models" . DIRECTORY_SEPARATOR . "examples" . DIRECTORY_SEPARATOR . 'examplesList.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'detection.json', $path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . 'detection.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'mainIndex.json', $path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . 'mainIndex.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'signIndex.json', $path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . 'signIndex.json');
			copy('lib' . DIRECTORY_SEPARATOR . 'training.json', $path . DIRECTORY_SEPARATOR . "performance" . DIRECTORY_SEPARATOR . 'training.json');
			// Update config files!

			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'), true);

			$dataconfig["groups"][] = Array(
					"groupName" => $_GET["newName"],
					"groupFolder" => $short . DIRECTORY_SEPARATOR,
					"collections" => Array()
			);
			$dataconfig["totalGroups"] = $dataconfig["totalGroups"] + 1;

			file_put_contents('data/dataconfig.json', json_encode($dataconfig));
		} else
			echo json_encode(Array(
					"error" => true
			));
		break;

	case "newCollection" :
		if(isset($_GET["newName"]) && isset($_GET['shortName'])) {
			$short = str_replace(' ', '', $_GET['shortName']);
			if(!ctype_alnum(str_replace(' ', '', $_GET['newName'])) || !ctype_alnum($short)) {
				// Name not alphanumeric!!
				echo json_encode(Array(
						"error" => true,
						"type" => "Bad name!",
						"short" => $short,
						"long" => $_GET["newName"]
				));
				break;
			}
			$path = $_SESSION['cuneidemo']["groupFolder"] . $short;

			mkdir($path, 0777);
			mkdir($path . DIRECTORY_SEPARATOR . "annotations" . DIRECTORY_SEPARATOR . "backup", 0777, true);
			mkdir($path . DIRECTORY_SEPARATOR . "archivedAnnotations");
			mkdir($path . DIRECTORY_SEPARATOR . "images");
			mkdir($path . DIRECTORY_SEPARATOR . "fp_files");
			mkdir($path . DIRECTORY_SEPARATOR . "thumbs");
			mkdir($path . DIRECTORY_SEPARATOR . "metaData");

			copy('lib' . DIRECTORY_SEPARATOR . 'imagesList.xml', $path . DIRECTORY_SEPARATOR . 'imagesList.xml');

			// add collection to config
			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'), true);

			$dataconfig["groups"][$_SESSION['cuneidemo']["group"]]["collections"][] = Array(
					"collectionName" => $_GET["newName"],
					"collectionFolder" => $short . DIRECTORY_SEPARATOR
			);

			file_put_contents('data/dataconfig.json', json_encode($dataconfig));

			$archiveJSON = json_decode(file_get_contents($_SESSION['cuneidemo']['groupFolder'] . "archivedAnnotations.json"), true);

			$archiveJSON["collections"][] = $_GET["newName"];

			file_put_contents($_SESSION['cuneidemo']['groupFolder'] . "archivedAnnotations.json", json_encode($archiveJSON));

			$performance = json_decode(file_get_contents($_SESSION['cuneidemo']['performance'] . "allDetected.json"), true);

			$performance["collections"][] = $short;

			foreach($performance["algorithms"] as $algo)
				$performance[$algo] = Array($short => Array());

			file_put_contents($_SESSION['cuneidemo']['performance'] . "allDetected.json", json_encode($performance));

		} else
			echo json_encode(Array(
					"error" => true
			));
		break;

	case "nearestModels" :

		// $fileName = _RESULTS_.$_SESSION['cuneidemo']['user']."_results_".$_SESSION['cuneidemo']['imageName']."_nearest.json";
		if(isset($_GET['detectionID']))
			$detectionID = $_GET['detectionID'];
		else
			$detectionID = $_SESSION['cuneidemo']['detectionID'];
		$fileName = $_SESSION['cuneidemo']['performance'] . "fullResults" . DIRECTORY_SEPARATOR . $detectionID . 'near.json';
		if(file_exists($fileName))
			$returnData = file_get_contents($fileName);
		else
			$returnData = json_encode(null);
		header('Content-Type: application/json');
		echo $returnData;
		break;
	case "confusion" :
		if(file_exists($_SESSION['cuneidemo']["performance"] . "CM" . DIRECTORY_SEPARATOR . "all_allSets_default_00.json"))
			$returnData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"] . "CM" . DIRECTORY_SEPARATOR . "all_allSets_default_00.json"), true);
		else
			$returnData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"] . "CM.json"), true);
		$ageG = $returnData["trainingAges"] - 1;
		$returnData = json_encode($returnData["training"][$ageG]["totalConfusion"]);

		// $returnData = file_get_contents($_SESSION['cuneidemo']["performance"]."confusion.json");
		header('Content-Type: application/json');
		echo $returnData;
		break;
	case "getTrainingAnnotations" :
		echo '<table style="margin:auto;"><tr>';

		$archiveJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder'] . "archivedAnnotations.json");
		$archive = json_decode($archiveJSON, true);

		$collectionNames = $archive['collections'];

		$counter = 0;
		foreach($archive['images'] as $group => $images) {
			echo "<th colspan=\"6\">$collectionNames[$group]</th></tr><tr>";
			// $statusAnnotations = $imageInfo->annotation['info'];

			foreach($images as $key => $annotation) {
				echo "<td><label style='white-space:nowrap; display:inline-block;vertical-align:middle; margin-top:0.5em;'>
							<input type='checkbox' value=$group id=$key name='annotations' checked=true style='width:1.5em;vertical-align:middle'/>$annotation </label></td>";
				$counter++;
				if(($counter % 6) == 0) {
					echo '</tr><tr>';
				}
			}
			for(; ($counter % 6) != 0; $counter++) {
				echo "<td></td>";
			}
			echo '</tr><tr>';
		}

		echo "</tr></table>";
		break;
	case "signInfo" :
		$signInfo = array();
		// PR
		$pr = $_SESSION['cuneidemo']['performance'] . 'PR' . DIRECTORY_SEPARATOR . 'signPR' . DIRECTORY_SEPARATOR . "$_GET[sign]_allSets_default.png";
		if(file_exists($pr)) {
			$signInfo["pr"] = true;
			$signInfo["prFile"] = $pr;
		} else
			$signInfo["pr"] = false;

		if(file_exists($_SESSION['cuneidemo']["groupModels"] . "$_GET[sign]_model.mat"))
			$signInfo["trainStatus"] = "trained";
		else

			$images = glob($_SESSION['cuneidemo']['groupModels'] . 'examples' . DIRECTORY_SEPARATOR . "model$_GET[sign]_*");
		$image = $images[0];
		$total = count($images);

		if(file_exists($_SESSION['cuneidemo']['groupModels'] . "$_GET[sign]_model.mat"))
			$signInfo["trainStatus"] = "trained";
		else
			$signInfo["trainStatus"] = ($total >= 10)?"trainable":"untrained";

		$signInfo["totalExamples"] = $total;

		if(file_exists($_SESSION['cuneidemo']["performance"] . "CM" . DIRECTORY_SEPARATOR . "all_allSets_default_30.json"))
			$returnData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"] . "CM" . DIRECTORY_SEPARATOR . "all_allSets_default_30.json"), true);
		else
			$returnData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"] . "CM.json"), true);
		$ageG = $returnData["trainingAges"] - 1;
		$signInfo["CM"] = true;
		$signInfo["CMdata"] = json_encode($returnData["training"][$ageG]["totalConfusion"][$_GET["sign"]]);
		echo json_encode($signInfo);
		break;

	case "getModelImage" :
		$data = Array();
		for($i = 0; $i < 3; $i++) {

			if(file_exists($_SESSION['cuneidemo']['groupModels'] . 'modelThumb' . DIRECTORY_SEPARATOR . 'thumb_' . $_GET["arr"][$i] . '_model001.jpg'))
				$data[] = $_SESSION['cuneidemo']['groupModels'] . 'modelThumb' . DIRECTORY_SEPARATOR . 'thumb_' . $_GET["arr"][$i] . '_model001.jpg';
			else {
				$images = glob($_SESSION['cuneidemo']['groupModels'] . 'examples' . DIRECTORY_SEPARATOR . "model" . $_GET["arr"][$i] . "_*");
				if($images[0] != null)
					$data[] = $images[0];
				else
					$data[] = 'lib/dummy.jpg';
			}
		}
		echo json_encode($data);
		break;
	case "ngram":
		echo file_get_contents("data/cuneiform/ngram.json");
		break;

	case "lastDetections":
		$detections = file($_SESSION['cuneidemo']["performance"]."statsImages".DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']["group"].$_SESSION['cuneidemo']["collection"].$_SESSION['cuneidemo']["imageName"].".txt", FILE_IGNORE_NEW_LINES);
		$info = Array();
		$total = (count($detections) < 6)?count($detections):6;
		$count = count($detections);

		for($i = 1; $i <= $total; $i++)
		{
			$infoToken = trim($detections[$count-$i]);
			$infoToken  = explode(",",$infoToken);
			if(count($infoToken) == 1)
				$info[] = [$detections[$count-$i], "Legacy Format"];

			else
				$info[] = $infoToken;
		}
		echo json_encode($info);
		break;
}
function getAllModels() {
	if(!isset($_GET['options']))
		$options = '';
	elseif($_GET['options'] != 'none')
		$options = "($options)";
	else
		$options = '';

	$models = array_fill(1, 907, 0);
	$main = $_SESSION['cuneidemo']['groupModels'];
	// $specific = _MATLABPATH_."models_cv_".$_SESSION['cuneidemo']['imageName'];

	// get all the files in the Folders.
	// Notice that the array is flipped as this will make the search faster.
	// IMPORTANT: this will (as of now) only search without options!

	$mainModels = array_flip(scandir($main));
	// $specModels = array_flip(scandir($specific));

	foreach($models as $sign => &$present) {
		$search = sprintf('%03d', $sign) . "_model$options.mat";
		$searchNormal = sprintf('%03d', $sign) . "_model.mat";
		// if(isset($specModels[$search]) || isset($mainModels[$searchNormal]))
		if(isset($mainModels[$searchNormal]))
			$present = 1;
	}

	return $models;
}
function getAlgorithms($options) {
	// IMPORTANT: this will (as of now) only search without options!
	if($options == 'none')
		$options = '';
	else
		$options = '(' . $options . ')';

	$algo['multi'] = false;
	$algo['all'] = false;

	$main = $_SESSION['cuneidemo']['groupModels'];
	// $specific = _MATLABPATH_."models_cv_".$_SESSION['cuneidemo']['imageName'];
	$mul = "multi_model$options.mat";
	$all = "all_model$options.mat";
	$mainModels = array_flip(scandir($main));
	// $specModels = array_flip(scandir($specific));
	// if(isset($specModels[$mul]) || isset($mainModels["multi_model.mat"]))
	if(isset($mainModels["multi_model.mat"]))
		$algo['multi'] = true;

		// if(isset($specModels[$all]) || isset($mainModels["all_model.mat"]))
	if(isset($mainModels["all_model.mat"]))
		$algo['all'] = true;

	return $algo;
}
function startingCheck() {
	/*
	 * For DETECTION:
	 * $text = sprintf("DETECTION\n%s\n{\"imageID\":%u,\"group\":%u,\"collection\":%u}\n%s\n%s",
	 * $_SESSION['cuneidemo']['verboseFile'], $imageID,$_SESSION['cuneidemo']['group'],$_SESSION['cuneidemo']['collection'],$algo,$todetect);
	 *
	 * For TRAINING:
	 * $text = sprintf("TRAINING\n%s\n%s", $_SESSION['cuneidemo']['verboseFile'], $annoFile);
	 *
	 * $matlabData['imagesPath'] = str_replace('', "", $_SESSION['cuneidemo']['imagesPath']);
	 * $matlabData['toTrain'] = $_POST['toTrain'];
	 * $matlabData['save'] = 0;
	 * $matlabData['reTrain'] = $reTrainFlag;
	 * $matlabData['annoOptions'] = '';
	 * $matlabData['outputOptions'] = '';
	 * $matlabData['modeldir'] = str_replace('', "", $_SESSION['cuneidemo']['groupModels']);
	 * $matlabData['groupFolder'] = str_replace('', "", $_SESSION['cuneidemo']['groupFolder']);
	 * $matlabData['userInfoFile'] = $info;
	 */
	if(file_exists(_USERS_ . $_SESSION['cuneidemo']['user'] . 'process.txt')) {
		$file = fopen(_USERDATA_ . $_SESSION['cuneidemo']['user'] . "process.txt", 'rb');
		$process = trim(fgets($file));
		$_SESSION['cuneidemo']['verboseFile'] = trim(fgets($file));
		$data = json_decode(fgets($file), true); // This is json data
		fclose($file);
		return array(
				'process' => true,
				'type' => $process,
				'data' => $data
		);
	}
	if(file_exists(_USERS_ . $_SESSION['cuneidemo']['user'] . '_backupDetection.txt')) {
		logMessage("Corrections available.");
		$backupCorrections = fopen(_USERS_ . $_SESSION['cuneidemo']['user'] . '_backupDetection.txt', 'rb');

		$image = fscanf($backupCorrections, "%u"); // first line is only for the server
		fclose($backupCorrections);
		return array(
				'process' => false,
				'backup' => true,
				'image' => $image
		);
	} else
		return array(
				'process' => false,
				'backup' => false
		);
}
function imageOptions() {
	// Search all images with same name and options
	$length = strlen($_SESSION['cuneidemo']['imageName']);
	$temp = glob($_SESSION['cuneidemo']['imagesPath'] . $_SESSION['cuneidemo']['imageName'] . '(*).jpg');
	if(empty($temp))
		return null;

	$options = array();

	foreach($temp as $longName) {
		$options[] = substr(basename($longName, '.jpg'), $length + 1, -1);
	}
	return $options;
}
function startUpInfo() {
	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$imagefile = $_SESSION['cuneidemo']['imagesPath'] . ($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file);
	$statusAnnotations = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation['info'];

	$autoload = $_SESSION['cuneidemo']['autoload'];
	$imagesize = getimagesize($imagefile . ".jpg");
	$width = $imagesize[0];
	$height = $imagesize[1];
	$urlThumbHOG = _RESULTS_ . $_SESSION['cuneidemo']["user"] . "HOG.jpg";
	$urlThumb = _RESULTS_ . $_SESSION['cuneidemo']["user"] . "thumbs.jpg";

	if($statusAnnotations == "partial") {
		$versions = (string) $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation['version'];
	} else {
		$versions = 0;
	}

	return array(
			'imageID' => $_SESSION['cuneidemo']['imageID'],
			'imageName' => $_SESSION['cuneidemo']['imageName'],
			'imageFile' => $imagefile,
			'statusAnnotations' => (string) $statusAnnotations,
			'autoload' => $_SESSION['cuneidemo']['autoload'],
			'imageWidth' => $width,
			'imageHeight' => $height,
			'urlThumb' => $urlThumbHOG,
			'urlThumbHOG' => $urlThumb,
			'version' => $versions,
			'collectionNr' => $_SESSION['cuneidemo']['collection'],
			'groupNr' => $_SESSION['cuneidemo']['group'],
			'collectionName' => $_SESSION['cuneidemo']['collectionName'],
			'groupName' => $_SESSION['cuneidemo']['groupName'],
			'user' => $_SESSION['cuneidemo']['user'],
			'metaData' => $_SESSION['cuneidemo']['metaData'],
			'page' => $_SESSION['cuneidemo']['page']
	);

	/*
	 * $_SESSION['cuneidemo']["imageName"] for tablet name and for title DONE
	 * echo "<script> var autoload = $GLOBALS[annotation]; < ------------------ !!!!!! Always autoload? No!!!!!
	 * var statusAnnotations = \"$GLOBALS[statusAnnotations]\"; DONE
	 * var annotationsVersions = $GLOBALS[versions]; DONE
	 * var urlThumbHOG = \""._RESULTS_.$_SESSION['cuneidemo']["user"]."HOG.jpg\"; DONE
	 * var urlThumb = \""._RESULTS_.$_SESSION['cuneidemo']["user"]."thumbs.jpg\"; </script>"; DONE
	 *
	 *
	 */
}

// // DELETE IMAGE. Is in this script just to not make it too available
function deleteImage() {
	$errorFlag = FALSE;

	$index = intval($_POST["imageId"]);
	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$annotationfile = $_SESSION['cuneidemo']['annotationsPath'] . ($xmlImages->image[$index]->annotation);
	$imagefile = $_SESSION['cuneidemo']['imagesPath'] . ($xmlImages->image[$index]->file);
	$imageThumb = $_SESSION['cuneidemo']['collectionFolder'] . thumbs . DIRECTORY_SEPARATOR . ($xmlImages->image[$index]->file) . '-thumb.jpg';
	$imagefile = $imagefile . '.jpg';

	// LOG START
	logMessage("Asked for deletion of file " . $_POST["imageId"] . " (" . (string) ($xmlImages->image[$index]->file) . ".jpg) in group ".$_SESSION['cuneidemo']['group']. "("
			. $_SESSION['cuneidemo']['groupName'] . "), collection ".$_SESSION['cuneidemo']['collection']." (" . $_SESSION['cuneidemo']['collectionName'] . ")");

	// save annotations' names

	if($xmlImages->image[$index]->annotation != "empty") {
		$annoList = glob("$annotationfile-v*.xml");
		array_push($annoList, "$annotationfile.xml");
	} else {
		$annoList = array();
	}
	array_push($annoList, $imagefile);
	array_push($annoList, $imageThumb);

	// BAckup everything in a zip-file
	$backupDirectory = 'data/trash/';

	$zip = new ZipArchive();
	$filename = $backupDirectory . $_SESSION['cuneidemo']['user'] . time() . ".zip";

	if($zip->open($filename, ZipArchive::CREATE) !== TRUE) {
		$error = "Error creating Zip file!";
		logMessage("Error creating Zip file!");
		$errorFlag = TRUE;
	} else {
		foreach($annoList as $anno) {
			$test = (boolean) ($zip->addFile($anno));

			if($test != TRUE) {
				$error = "Error adding file to Zip file!";
				logMessage("Error adding file '$anno' to Zip file!");
				$errorFlag = TRUE;
			}
		}
		$zip->close();

		if(!$errorFlag) {
			logMessage("Image and Annotations saved to ZIP: $filename");

			// Erase Files
			foreach($annoList as $anno) {
				$err = unlink($anno);
				if(!$err) {
					$error = "Error erasing File";
					logMessage("Error erasing File");
					$errorFlag = TRUE;
				}
			}

			logmessage("Image and Annotations erased from disk");
		}
	}

	if($errorFlag) {
		echo json_encode(array(
				'error' => true,
				'Errormsg' => $error
		));
	} else {
		// Change image total
		$total = (int) $xmlImages->total;
		$total--;
		$xmlImages->total = $total;

		// REMOVE FROM XML
		unset($xmlImages->image[$index]);

		$counter = 1;

		// Change ID from files
		foreach($xmlImages->image as $imageInfo) {
			$imageInfo->id = $counter;
			$counter++;
		}
		$xmlImages->asXML($_SESSION['cuneidemo']['imagesList']);

		logMessage("Image erased from  XML and XML ids updated");
		echo json_encode(array(
				'error' => false
		));
	}
}
function testing() {
	return;
	$errorFlag = FALSE;

	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$annotationfile = $_SESSION['cuneidemo']['annotationsPath'] . ($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation);
	$imagefile = $_SESSION['cuneidemo']['imagesPath'] . ($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file);
	$imageThumb = $imagefile . '-thumb.jpg';
	$imagefile = $imagefile . '.jpg';

	// LOG START
	logMessage("Asked for deletion of file " . $_SESSION['cuneidemo']['annotationsPath'] . ($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->name) . " in group " . $_SESSION['cuneidemo']['group'] . ", collection " . $_SESSION['cuneidemo']['collection']);

	// REMOVE FROM XML
	unset($xmlImages->image[3]);

	$counter = 0;

	// Change ID from files
	foreach($xmlImages->image as $imageInfo) {
		$imageInfo->id = $counter;
		$counter++;
	}
	$xmlImages->asXML($_SESSION['cuneidemo']['imagesList']);

	logMessage("Image erased from  XML and XML ids updated");

	// BAckup everything in a zip-file
	$backupDirectory = 'data/trash/';
	$annoList = glob("$annotationfile-v*.xml");
	array_push($annoList, "$annotationfile.xml");
	array_push($annoList, $imagefile);
	array_push($annoList, $imageThumb);

	$zip = new ZipArchive();
	$filename = $backupDirectory . $_SESSION['cuneidemo']['user'] . time() . ".zip";

	if($zip->open($filename, ZipArchive::CREATE) !== TRUE) {
		$error = "Error creating Zip file!";
		logMessage("Error creating Zip file!");
		$errorFlag = TRUE;
	} else {
		foreach($annoList as $anno) {
			if($zip->addFile($anno) !== TRUE) {
				$error = "Error adding file to Zip file!";
				logMessage("Error adding file to Zip file!");
				$errorFlag = TRUE;
			}
		}
		$zip->close();

		if(!errorFlag) {
			logMessage("Image and Annotations saved to ZIP: $filename");

			// Erase Files
			foreach($annoList as $anno) {
				$err = unlink($anno);
				if(!$err) {
					$error = "Error erasing File";
					logMessage("Error erasing File");
					$errorFlag = TRUE;
				}
			}

			logmessage("Image and Annotations erased from disk");
		}
	}

	if($errorFlag) {
		echo json_encode(array(
				'error' => true,
				'Errormsg' => $error
		));
	} else {
		echo json_encode(array(
				'error' => false
		));
	}
}
?>
