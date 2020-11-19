<?php
// This file deals with storing and sending the meta-data to and from the web-interface.
// It will work as a stand alone POST website _and_ as a small library function for other files.
// Don't forget: most of the group/path, etc. information is always stored in $_SESSION['cuneidemo']!  //TD@ 'cuneidemo'


/* Meta-data format file.
 * meta.cfg in the group directory.
 * should just contain a label per category in each line (plain text.
 * ALWAYS include the full path and name of the image(s), even without reference in cfg
 * Also, name for the
 * Ignore Lines started with # (Comments)
 */

//// Start here and check if the function is being called


/* Meta-data storing:
 * Propably a JSON-file. (better plain text? xml?)
 * Label: content
 * or
 * Label: [content] ?
 */

if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

// debug: content of cuneidemo
//print_r($_SESSION['cuneidemo']);

if($_SESSION['cuneidemo']["enabled"] != true)
{
	echo "nope! Could not find important session entry!";
	exit;
}
include_once('config.php'); // Needed for the different Folders
include_once('logger.php');


if(isset($_POST['action']))
{
	if($_POST['action']== "saveData")
		storeMetaData();

	exit();
}elseif(isset($_GET['action']))
{
	$_GET['action']== "loadData";
	loadMetaData();
}else
	generateFormular();



function storeMetaData()
{
	// check if file exists

	// if not, will be created at teh end
	$newMetaData = Array();
	foreach($_POST['fields'] as $name => $content)
	{
		$newMetaData[$name] = $content;
	}
	file_put_contents($_SESSION['cuneidemo']['collectionFolder'].'metaData'.DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']["imageName"].".json", json_encode($newMetaData));
}

function loadMetaData()
{
	//if($_SESSION['nagbu']['metaData'] == "none")
		//return false;
	$file= $_SESSION['cuneidemo']['collectionFolder'].'metaData'.DIRECTORY_SEPARATOR.$_SESSION['cuneidemo']["imageName"].".json";
	if(file_exists($file))
	{
		//$metaCfg = loadMetaConfig(); // needed?

	// load meta file for image - Shoudl this be referenced in the XML file? YES! - No, get real
		$jsonData = json_decode(file_get_contents($file),true);
	}
	else
		$jsonData = Array("identifier"=>$_SESSION['cuneidemo']["imageName"]);
	// TODO check integrity agains $metaCfg

	return $jsonData;

}

function loadMetaConfig() // what for??
{
	$cfgFile = file($_SESSION['cuneidemo']['groupFolder'].'meta.cfg',FILE_IGNORE_NEW_LINES);

	$metaCfg = Array(Array("identifier","Identifier"));

	foreach($cfgFile as $cfg)
	{
		if($cfg != "")  // in case an empty line was there
		{
		if($cfg[0] != '#') // Not a comment, proceed
		{
			trim($cfg);

				$temp = explode('$',$cfg);

				$temp[0] = strtolower($temp[0]);

				if($temp[1] == null)
					$temp[1] ="";

				$metaCfg[] = $temp;
			}
		}
	}

	return $metaCfg;
}

function eraseMetaConfigField()
{

}

function addMetaConfigField()
{

}

function updateMetaConfig()
{

}

function generateFormular()
{
	$metaCfg = loadMetaConfig();

	$jsonData = Array();

	$table = '<form method="POST" action="">';
	$config = Array();

	// TODO better names
	foreach($metaCfg as $cfg)
	{
		$cfg[0] = trim($cfg[0]);
		$config[] = $cfg[0];
		if($cfg[0][0] == '-')
		{
			$table .= "<div class='center' style='border-bottom:solid'><b> $cfg[1] </b></div>";
		}elseif($cfg[1] != "")
			$table .= "<p><label for=\"$cfg[0]\">$cfg[1]:</label> <input type=\"text\" id=\"$cfg[0]\"></p><br/>";
		else
			$table .= "<p><label for=\"$cfg[0]\">$cfg[0]:</label><input type=\"text\" id=\"$cfg[0]\"></p><br/>";

	}
	$table .= '</form>';

	$jsonData['layout'] = $table; // Change and generate with JS!
	$jsonData['fields'] = $config; // just use this!
	$jsonData['data'] = loadMetaData();
	echo json_encode($jsonData);
}
?>
