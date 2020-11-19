<?php if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
	if($_SESSION['cuneidemo']["enabled"] != true)
	{
		exit;
	}

	include_once('config.php');
	include_once('logger.php');
// 	if(isset($_GET["version"]))
// 	{
// 		$_SESSION['cuneidemo']["version"] = $_GET["version"];
// 		echo json_encode(array('done' => true)	);
// 		exit;
// 	}
// 	else
// 	{
// 	$xmlImages = simplexml_load_file(_IMAGESLIST_);
// 	$imageID = intval($_SESSION['cuneidemo']['imageID']);
// 	$name = $xmlImages->image[$imageID]->name;
// 	$annotationfile = _ANNOTATIONS_.($xmlImages->image[$imageID]->annotation);

// 	$xmlAnnotation = simplexml_load_file($annotationfile);

// 	header ("Content-Type:text/xml");
//     echo $xmlAnnotation->saveXML();
// 	}

	if($_GET["version"]==0)
		{
			$version = "";
		}
	else
		{
			$version = "-v".$_GET["version"];
		}

	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$imageID = intval($_SESSION['cuneidemo']['imageID']);
	$name = $xmlImages->image[$imageID]->name;
	$annotationfile = $_SESSION['cuneidemo']['annotationsPath'].($xmlImages->image[$imageID]->annotation).$version.".xml";
	$fileName = (string)$xmlImages->image[$imageID]->annotation;



	// change header!!!!
	header ("Content-Type: application/json");

	$lines_file = $_SESSION['cuneidemo']['collectionFolder']."archivedAnnotations" . DIRECTORY_SEPARATOR.$fileName."_lines.csv";

	if(file_exists($lines_file))
		$lines = file_get_contents($lines_file);
	else
		$lines ="";

	if(file_exists($annotationfile))
	{
		$xmlAnnotation = simplexml_load_file($annotationfile);
		$xml = $xmlAnnotation->saveXML();
	}
	else
		$xml = "";

	$annotations = Array("xml"=>$xml, "csv" => $lines);

    echo json_encode($annotations);
    if($version == "")
    	$version = "newest";
	logMessage("images'annotations loaded (version == $version)");
?>
