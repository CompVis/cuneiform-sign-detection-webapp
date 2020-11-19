<?php
if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
include_once('config.php');
include_once('logger.php');
if($_SESSION['cuneidemo']["enabled"] != true)
{
	exit;
}

$DS = DIRECTORY_SEPARATOR;

logMessage("Sending results to client");

$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
$imageID = intval($_SESSION['cuneidemo']['imageID']);
$name = $xmlImages->image[$imageID]->file;

$base_directory = $_SESSION['cuneidemo']["performance"].'fullResults'.$DS;

$detection_files = Array();
$detection_found = FALSE;

if(isset($_GET['network_version']))
{
	$number = $_GET['network_version'];

	//$folder = sprintf("v%03d", $number);
	$folder = $number;
	$search_file = glob($base_directory.$folder.$DS.$_SESSION['cuneidemo']['collectionFolderName'].$name.'*.csv');

	if(!empty($search_file))
	{
		$detection_found = TRUE;
		$detection_files[$number] = $search_file[0];
		$version_counter = $number;
	}
	else
		$detection_found = FALSE;
}
else
{
	$all_folders = glob($base_directory.'v*');
	$version_counter = 1;

	usort( $all_folders, function( $a, $b ) { return filemtime($a) - filemtime($b); } );

	$folder = $all_folders[0];
	//echo $base_directory.basename($folder).$DS.$_SESSION['cuneidemo']['collectionFolderName'].$name.'*.csv';
	foreach($all_folders as $folder)  //@TD
	{  //@TD

		$search_file = glob($base_directory.basename($folder).$DS.$_SESSION['cuneidemo']['collectionFolderName'].$name.'*.csv');

		if(!empty($search_file))
		{
		//	var_dump($search_file[0]);
			$detection_found = TRUE;
			$number = basename($folder);


				$detection_files[$number] = $search_file[0];

			$version_counter = $number;
		//	$version_counter = ($version_counter < $number)?$number:$version_counter;

			//usort( $search_file, function( $a, $b ) { return filemtime($a) - filemtime($b); } );

		}

	}  //@TD
}

if(!$detection_found)
{
	echo "Error: No results file found.";
	exit();
}

$returnData = array("network_version"=> $version_counter, "data" => Array());

$detection_file = $detection_files[$version_counter];

//$_SESSION['cuneidemo']["performance"].'fullResults'.$DS.$net_version.$DS.$_SESSION['cuneidemo']['collectionFolderName'].$DS.$name.'.txt';

if(file_exists($detection_file))
{
	$resultsData = fopen($detection_file, "r");
}


$counter = 1;

// get rid of first line or look for a CSV-reader in PHP
if(fgetcsv($resultsData) == NULL)
{
	echo "Error: $imageID - $name ";
	echo $_SESSION['cuneidemo']['collectionFolderName'];
	exit();
}


//while ($signInfo = fscanf($resultsData, "%s%f%f%f%f%f"))
while( ($signInfo = fgetcsv($resultsData)) !== FALSE )
{

	list($symbol, $xmin, $ymin, $xmax, $ymax, $score) = $signInfo;

	$returnData['data'][] = array("name"=>$counter, "symbol"=>$symbol, "xmin"=>$xmin, "ymin"=>$ymin, "xmax"=>$xmax, "ymax" => $ymax,
			"confidence"=>trim($score), "basic"=>0, "ngram"=>0, "ngramlr"=>0, "ngramrl"=>0);
	$counter++;
}

$returnData['name'] = $name;
$returnData['id'] = $imageID;


fclose($resultsData);

$encoded_data =  json_encode($returnData);

//$json_file = $_SESSION['cuneidemo']["performance"].'fullResults'.$DS.$net_version.$DS.$_SESSION['cuneidemo']['collectionFolderName'].$DS.$name.".json";
//if(!file_exists($json_file))
//file_put_contents($json_file,json_encode($encoded_data));

header('Content-Type: application/json');
echo $encoded_data;
