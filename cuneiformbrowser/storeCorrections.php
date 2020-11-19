 <?php session_start();
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	exit;
 }
 include_once('config.php');
 include_once('logger.php');

 logMessage("Feedback sent!");

// boxArray['symbol'] = this.symbol;
// boxArray['xmin'] = Math.round(this.xmin);
// boxArray['ymin'] = Math.round(this.ymin);
// boxArray['xmax'] = Math.round(this.xmax);
// boxArray['ymax'] = Math.round(this.ymax);
// boxArray['fp'] = this.fp;
// boxArray['correction'] = this.correction;
// boxArray['reviewed'] = this.reviewed;

// 'fpList': signsList,						->
// 'positives' : positives,					-> element.fp == false
// 'fp' : falsePositives,					-> element.fp == true  correction == 000 no sign, else a sign
// 'threshold': threshold,
// 'totalDetections': totalDetections, do I need this?
// 'threshDetections': threshDetections,
// 'fullFeedback': JSON.stringify(boxes)    wozu?
// 'detectionID'   important!!!


if(!is_array($_POST['fpList']))
	$_POST['fpList'] = Array($_POST['fpList']);
if(!is_array($_POST['fp']))
	$_POST['fp'] = Array($_POST['fp']);

$list = $_POST['fpList'];
$fp = $_POST['fp'];
$pos = $_POST['positives'];
$time = @date('[d/M/Y:H:i:s]');
$newAnno = $_POST["newAnnotation"];

$fpFiles = array();

// save the whole feedback (for recall and stuff)
file_put_contents($_SESSION['cuneidemo']["performance"]."fullFeedback".DIRECTORY_SEPARATOR.$_POST['detectionID'].".json", $_POST['fullFeedback']);

// load the main FP-list
$fpJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."fp_list.json");
$fpList = json_decode($fpJSON,true);

// check if annotation is archived, if not, save tp too - Check performed at training!

$tpJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."tp_list.json");
$tpList = json_decode($tpJSON,true);


// create the individual files for the signs' fp
//{
//	"fpAvailable":["010"],
//"x010": {
//	"BM":["K04310Fr"],
//	"VAT":["VAT13604Vs"]
//		}
//}

// get the collection folder without the backslash!
$collection = str_replace($_SESSION['cuneidemo']['groupFolder'], "", $_SESSION['cuneidemo']['collectionFolder']);
$collection = substr($collection,0,-1);

foreach($list as $sign)
{
	$fileID = fopen(sprintf($_SESSION['cuneidemo']['collectionFolder'].'fp_files'.DIRECTORY_SEPARATOR.'falsepositive_%03d_im_'.$_SESSION['cuneidemo']['imageName'].'.txt',$sign),'w');
	$fpFiles[$sign] = $fileID;
	// Add the sign to the main list
	if(in_array($sign,$fpList["fpAvailable"])) // is there already an entry?
	{
		if(!in_array($collection,$fpList["x$sign"]))
		{
			$fpList["x$sign"][$collection] = Array();
		}

		if(!in_array($_SESSION['cuneidemo']['imageName'],$fpList["x$sign"][$collection])) // is the image already listed? TODO do this right!!!!
		{
			$fpList["x$sign"][$collection][] = $_SESSION['cuneidemo']['imageName']; // No, save it
		}
	}
	else // create a new entry from the ground!
	{
		$fpList["fpAvailable"][] = $sign;
		$fpList["x$sign"] = Array();
		$fpList["x$sign"][$collection] = Array();
		$fpList["x$sign"][$collection][] = $_SESSION['cuneidemo']['imageName'];
	}

}

$fpJSON = json_encode($fpList);

file_put_contents($_SESSION['cuneidemo']['groupFolder']."fp_list.json",$fpJSON);


$fpFile = fopen($_SESSION['cuneidemo']['collectionFolder'].'fp_files'.DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']['imageName'].'_fp.txt','w');
$tpFile = fopen($_SESSION['cuneidemo']['collectionFolder'].'fp_files'.DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']['imageName'].'_tp.txt','w'); // not appending anything!
$logUser = fopen(_LOGPATH_.$_SESSION['cuneidemo']['user'].'_'.$_SESSION['cuneidemo']['imageName'].'_detectionsFeedback.txt','a');
fwrite($logUser, "$time\nFalse Positives\n");

$all = array_merge($pos,$fp); // to save all TP! redundant?
$index = Array(); // to keep the number of signs
foreach($all as $false)
{
	/*
	 * { "tpAvailable":[],
		 "Sign":{"total":0,
		 		 "collection":
		 				[{"imageName":0}]}
	   }
	 */

	$tp = false;
	if($false["fp"] == "true" && $false["correction"] != "000")
	{
		$sign = $false["correction"];
		fprintf($tpFile,"%03d %d %d %d %d\n", $sign,$false['xmin'],$false['ymin'],$false['xmax'],$false['ymax']);
		$tp = true;
	}elseif($false["fp"] == "false")
	{
		$sign = $false["symbol"];
		fprintf($tpFile,"%03d %d %d %d %d\n", $sign,$false['xmin'],$false['ymin'],$false['xmax'],$false['ymax']);
		$tp = true;
	}


	if($false["fp"] != "false")
	{
		fprintf($fpFile,"%03d %d %d %d %d\n", $false['symbol'],$false['xmin'],$false['ymin'],$false['xmax'],$false['ymax']);
		fprintf($logUser,"%03d %d %d %d %d\n", $false['symbol'],$false['xmin'],$false['ymin'],$false['xmax'],$false['ymax']);
		fprintf($fpFiles[$false['symbol']],"void 0.5 0 %f %f %f %f\n", $false['xmin'],$false['ymin'],$false['xmax'],$false['ymax']);
	}
	if($tp)
	{

		if(!in_array($sign, $index))
		{
			$index[$sign] = 0;
		}
		// Now check for FP that can be used as TP for training
		if(in_array($sign,$tpList["tpAvailable"])) // is there already an entry?
		{
			if(!isset($tpList["x$sign"][$collection]))
			{
				$tpList["x$sign"][$collection] = Array();
			}

			if(!isset($tpList["x$sign"][$collection][$_SESSION['cuneidemo']['imageName']])) // is the image already listed? TODO do this right!!!!
			{

				$tpList["x$sign"][$collection][$_SESSION['cuneidemo']['imageName']] =0; // No, save it
			}
		}
		else // create a new entry from the ground!
		{
			$tpList["tpAvailable"][] = $sign;
			$tpList["x$sign"] = Array();
			$tpList["x$sign"]["total"] = 0;
			$tpList["x$sign"][$collection] = Array();
			$tpList["x$sign"][$collection][$_SESSION['cuneidemo']['imageName']] = 0;
		}
		$index[$sign] += 1;
	}

}
foreach($index as $sign=>$value)
{
	if($value != intval($tpList["x$sign"][$collection][$_SESSION['cuneidemo']['imageName']])) //different number of detections, something changed!
	{
		$tpList["x$sign"]["total"] += $value;
		$tpList["x$sign"][$collection][$_SESSION['cuneidemo']['imageName']] += $value;
	}
}
$tpJSON = json_encode($tpList);

file_put_contents($_SESSION['cuneidemo']['groupFolder']."tp_list.json",$tpJSON);

fclose($fpFile);
fclose($tpFile);

foreach($fpFiles as $file)
{
	fclose($file);
}

$posFile = fopen($_SESSION['cuneidemo']['annotationsPath'].$_SESSION['cuneidemo']['imageName'].'_p.txt','w');
fwrite($logUser, "\nPositives\n");

foreach($pos as $positive)
{
	fprintf($posFile,"%03d %d %d %d %d\n", $positive['symbol'],$positive['xmin'],$positive['ymin'],$positive['xmax'],$positive['ymax']);
	fprintf($logUser,"%03d %d %d %d %d\n", $positive['symbol'],$positive['xmin'],$positive['ymin'],$positive['xmax'],$positive['ymax']);
}

fclose($posFile);
fclose($logUser);

generateConfusion();

// now erase the user detection's backup.
unlink(_USERS_.$_SESSION['cuneidemo']['user'].'_backupDetection.txt');

logMessage("Feedback stored in ".$_SESSION['cuneidemo']['collectionFolder'].'fp_files'.DIRECTORY_SEPARATOR.'falsepositives_CLS_in_'.$_SESSION['cuneidemo']['imageName'].'.txt and '.$_SESSION['cuneidemo']['annotationsPath'].$_SESSION['cuneidemo']['imageName'].'_p.txt');

// check if annotation exist, if not, generate one!
if(!file_exists($_SESSION['cuneidemo']["annotationsPath"].$_SESSION['cuneidemo']['imageName'].".xml") &&
		!file_exists($_SESSION['cuneidemo']['collectionFolder']."archivedAnnotations" . DIRECTORY_SEPARATOR. 'im_'.$_SESSION['cuneidemo']['imageName'].".xml") && $newAnno)
{
	generateAnnotation($_SESSION['cuneidemo']['imageName'], $_POST['fullFeedback']);
}


////////  FUNCTIONS  /////////////////

function generateConfusion()
{
	$detectionID = $_POST['detectionID'];

	$detectionData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."statsGeneral".DIRECTORY_SEPARATOR.$_POST['detectionID'].".json"),true);

	// First, get the list of all the sings detected and corrected
/* 	$list = $_POST['fpList']; // fpList

	foreach($_POST['positives'] as $positive) // add positives to the list
	{
		if(!in_array($positive['symbol'], $list))
			$list[] = $positive['symbol'];
	}

	// now add the corrected names too!

	foreach($_POST['fp'] as $false)
	{
		if(!in_array($false['symbol'], $list))
			$list[] = $false['symbol'];

	} */

	// generate the table!
	if($detectionData["searched"] == "all")
		$allSearched = $detectionData["availableSearched"];
	else
		$allSearched = $detectionData["searched"];

	$list = $allSearched;

	foreach($_POST['fp'] as $false)
	{
		if(!in_array($false['correction'], $list))
			$list[] = $false['correction'];

	}

	$CM = array_fill_keys($allSearched, array_fill_keys($list,0));

	// some counters
	$totalPos = 0;
	$totalFP = 0;
	$totalWrong = 0;

	foreach($_POST['positives'] as $positive)
	{
		$CM[$positive['symbol']][$positive['symbol']] += 1;
		$totalPos += 1;
	}

	foreach($_POST['fp'] as $false)
	{
		$CM[$false['symbol']][$false['correction']] += 1;
		if($false['correction'] == "000")
			$totalWrong += 1;
		else
			$totalFP += 1;
	}

	$detectionData["feedback"] = true;

	$detectionData["FeedbackData"] = Array();
	$detectionData["FeedbackData"]["detected"] = $_POST['threshDetections'];
	$detectionData["FeedbackData"]["correct"] = $totalPos;
	$detectionData["FeedbackData"]["falsePositive"] = $totalFP;
	$detectionData["FeedbackData"]["falseDetection"] = $totalWrong;
	$detectionData["FeedbackData"]["threshhold"] =  $_POST['threshold'];
	$detectionData["FeedbackData"]["confusion"] = $CM;

	file_put_contents($_SESSION['cuneidemo']["performance"]."statsGeneral".DIRECTORY_SEPARATOR.$_POST['detectionID'].".json", json_encode($detectionData));

	file_put_contents($_SESSION['cuneidemo']["performance"]."statsImages".DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']['imageName']."_".$_SESSION['cuneidemo']['collection'].".json", json_encode($detectionData));

	//$generalData["training"][$ageG]["detections"][$_POST['detectionID']]= $CM;

	// Now, aa series of CM will be updated:
	// general for this age -> $generalData
	// For the signs (avoid?)
	// For the search itself
	// Training and test sets.
	// now actualize the individual sign info
	//first, check if image is in training set:
	$trainingData = json_decode(file_get_contents($_SESSION['cuneidemo']["groupFolder"]."archivedAnnotations.json"),true);

	if(in_array($_SESSION['cuneidemo']['imageName'],$trainingData["images"][$_SESSION['cuneidemo']['collection']]))
		$trainingData = true;
	else
		$trainingData = false;

	$generalData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."CM.json"),true);

	if($trainingData)
		$setCM = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."CMtrain.json"),true);
	else
		$setCM = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."CMtest.json"),true);

	$ageG = $generalData["trainingAges"]-1;

	foreach($allSearched as $searched)
	{
		$signData = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."statsModels".DIRECTORY_SEPARATOR.$searched.".json"),true);
		$age = $signData["trainingAges"]-1;

		// save the CM
		$signData["training"][$age]["detections"][$_POST['detectionID']] = $CM[$searched];

		if(!array_key_exists($searched, $generalData["training"][$ageG]["totalConfusion"]))
			$generalData["training"][$ageG]["totalConfusion"][$searched] = Array();

		if(!array_key_exists($searched, $setCM["training"][$ageG]["totalConfusion"]))
			$setCM["training"][$ageG]["totalConfusion"][$searched] = Array();

		foreach($CM[$searched] as $cmName => $cmCount)
		{
			if(!array_key_exists($cmName, $signData["training"][$age]["totalConfusion"]))
				$signData["training"][$age]["totalConfusion"][$cmName] =  $cmCount;
			else
				$signData["training"][$age]["totalConfusion"][$cmName] = $cmCount + intval($signData["training"][$age]["totalConfusion"][$cmName]);

			if(!array_key_exists($cmName, $generalData["training"][$ageG]["totalConfusion"][$searched]))
				$generalData["training"][$ageG]["totalConfusion"][$searched][$cmName] =  $cmCount;
			else
				$generalData["training"][$ageG]["totalConfusion"][$searched][$cmName] += $cmCount;

			if(!array_key_exists($cmName, $setCM["training"][$ageG]["totalConfusion"][$searched]))
				$setCM["training"][$ageG]["totalConfusion"][$searched][$cmName] =  $cmCount;
			else
				$setCM["training"][$ageG]["totalConfusion"][$searched][$cmName] += $cmCount;

		}

		// Save the data!

		file_put_contents($_SESSION['cuneidemo']["performance"]."statsModels".DIRECTORY_SEPARATOR.$searched.".json", json_encode($signData));
	}

	file_put_contents($_SESSION['cuneidemo']["performance"]."CM.json", json_encode($generalData));

	if($trainingData)
		file_put_contents($_SESSION['cuneidemo']["performance"]."CMtrain.json",json_encode($setCM));
	else
		file_put_contents($_SESSION['cuneidemo']["performance"]."CMtest.json",json_encode($setCM));

}

function generateAnnotation($name, $jsonString)
{
	//$file = 'matlab/data/cuneiform/performance/fullFeedback/0000000050.json';
	//$name = "P336660";
	$col = 1;


	// now generate the annotation
	$jsonAnno = json_decode($jsonString,true);

	// <?xml version="1.0"
	// <annotation><folder>KileS</folder><filename>P335598</filename><size><width>1537</width><height>2312</height></size>

	$xmlAnno = simplexml_load_string('<?xml version="1.0" encoding="UTF-8"?><annotation></annotation>');
	//$xmlAnno = $xmlAnnoAll->addChild("annotation");
	$xmlAnno->addChild("folder","KileS");
	$xmlAnno->addChild("filename",$name);

	$size = $xmlAnno->addChild("size");
	$s = getimagesize($_SESSION['cuneidemo']["imagesPath"]."$name.jpg");
	$size->addChild("width",$s[0]);
	$size->addChild("height",$s[1]);

	$id = 1;

	foreach ($jsonAnno as $jsonBB){

		// {"id":1,"xmin":261.215295,"ymin":306.4701,"xmax":362.0387,"ymax":373.3524,"symbol":"010", etc , "reviewed":true,"fp":false
		/*<object>
		<name>1</name>
		<symbol>495</symbol>
		<bndbox>
		<xmin>584</xmin>
		<ymin>620</ymin>
		<xmax>694</xmax>
		<ymax>698</ymax>
		</bndbox>
		<center>
		<xc>639</xc>
		<yc>659</yc>
		</center>
		<coordpos><row>1</row><col>1</col></coordpos>
		<hrsymbol>e2</hrsymbol>
		</object>*/
		$newSign = false;
		if($jsonBB != null)
		{
			if($jsonBB["reviewed"] == true)
			{
				if($jsonBB["fp"] == false)
				{
					$newSign = true;
					$signName = $jsonBB["symbol"];
					$read = $jsonBB["readableSymbol"];
				}elseif($jsonBB["correction"] != "000")
				{
					$newSign = true;
					$signName = $jsonBB["correction"];
					$read = $jsonBB["corRead"];
				}else
				{
					$newSign = false;
				}

				if($newSign)
					{
						$xmlBox = $xmlAnno->addChild("object");
						$xmlBox->addChild("name",$id);
						$xmlBox->addChild("symbol",$signName);
						$xmlBox->addChild("readableSymbol",$read);
						$box = $xmlBox->addChild("bndbox");
						$box->addChild("xmin", $jsonBB["xmin"]);
						$box->addChild("ymin", $jsonBB["ymin"]);
						$box->addChild("xmax", $jsonBB["xmax"]);
						$box->addChild("ymax", $jsonBB["ymax"]);
						$center = $xmlBox->addChild("center");
						$center->addChild("xc",($jsonBB["xmax"]-$jsonBB["xmin"])/2);
						$center->addChild("yc",($jsonBB["ymax"]-$jsonBB["ymin"])/2);
						$coor = $xmlBox->addChild("coordpos");
						$coor->addChild("row",1);
						$coor->addChild("col",1);
						$id += 1;
					}

			}




		}

	}

	$xmlAnno->asXML($_SESSION['cuneidemo']["annotationsPath"].$name.".xml");

	//var_dump($xmlAnno);
	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);

	$image =$xmlImages->xpath('//image[file = "'.$name.'"]')[0];

	echo "<pre>";
	var_dump($image);
	echo "</pre>";

	$image->annotation["version"] = 1;
	$image->annotation["info"] = "partial";
	$image->annotation = $name;

	echo "<pre>";
	var_dump($image);
	echo "</pre>";

	$xmlImages->asXML($_SESSION['cuneidemo']['imagesList']);

}
?>
