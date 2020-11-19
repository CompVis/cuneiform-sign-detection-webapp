<?php
	include_once('config.php');
	include_once('logger.php');

	if(isset($_GET['collection'])) // no collection info -> probably a bookmark, so reload everything!!! -> should be on the get line!!!
	{
		//$xmlData = simplexml_load_file('data/dataconfig.xml');
			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'),true);
			$_SESSION['cuneidemo']['collection'] = $_GET['collection'];
			$_SESSION['cuneidemo']['group'] = $_GET['group'];

			$groupFolder = $dataconfig["groups"][intval($_GET['group'])]["groupFolder"];
			//$groupFolder = $xmlData->group[intval($_GET['group'])]->folder.DIRECTORY_SEPARATOR;

			//$collection = $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->folder.DIRECTORY_SEPARATOR;
			$collection = $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionFolder"];
			$_SESSION['cuneidemo']['collectionFolder'] = 'data/'.$groupFolder.$collection;
			$_SESSION['cuneidemo']['imagesPath'] = 'data/'.$groupFolder.$collection.'images'.DIRECTORY_SEPARATOR;
			//$_SESSION['cuneidemo']['imagesPath'] = 'data/'.$groupFolder.$collection;
			$_SESSION['cuneidemo']['imagesList'] = 'data/'.$groupFolder.$collection.'imagesList.xml';
			$_SESSION['cuneidemo']['annotationsPath'] = 'data/'.$groupFolder.$collection.'annotations'.DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['groupModels'] = 'data/'.$groupFolder.'models/';
			$_SESSION['cuneidemo']['groupFolder'] = 'data/'.$groupFolder;

			//$_SESSION['cuneidemo']['groupName'] = (string) $xmlData->group[intval($_GET['group'])]->name;
			$_SESSION['cuneidemo']['groupName'] =  $dataconfig["groups"][intval($_GET['group'])]["groupName"];

			//$_SESSION['cuneidemo']['collectionName'] = (string) $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->name;
			$_SESSION['cuneidemo']['collectionName'] =  $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionName"];

			$_SESSION['cuneidemo']["performance"] = $_SESSION['cuneidemo']['groupFolder']."performance".DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']["page"] = $_GET["page"];
	}

	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$_SESSION['cuneidemo']["imageID"] = intval($_GET['image']);
	$annotation = $_GET['annotation'];
	$_SESSION['cuneidemo']['autoload'] = $_GET['annotation'];
	$name = (string) $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->name;
	$annotationfile = $_SESSION['cuneidemo']['imagesPath'].($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation);
	$type = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->name['type'];
	$statusAnnotations = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation['info'];

	if(isset($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file['metaData']))
		$_SESSION['cuneidemo']["metaData"] = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file['metaData'];
	else
	$_SESSION['cuneidemo']["metaData"] = "none";

	if($statusAnnotations == "partial")
	{
		$versions = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->annotation['version'];
	}else {
		$versions = 0;
	}
	$_SESSION['cuneidemo']["imageName"]=$name;


// 	if ($type=="front")
// 	{
// 		$name = $name."Vs";
// 	}
// 	else
// 	{
// 		$name = $name."Rs";
// 	}

	//$_SESSION['cuneidemo']["fileName"] = $xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file;
	//$_SESSION['cuneidemo']["test"] = "hey you";
	logMessage("image $name opened in editor.");


function webTitle()
{	global $name, $annotation;
	echo "<title>Edition ".$_SESSION['cuneidemo']["imageName"]."</title>";
}

function tabletName()
{

	echo $GLOBALS['name'];
}

function insertSVG()
{
	global $xmlImages;
	$imagefile = $_SESSION['cuneidemo']['imagesPath'].($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file);
	$imagesize =  getimagesize($imagefile.".jpg");
	$width = $imagesize[0];
	$height = $imagesize[1];
	echo "<svg width=\"$width\" height=\"$height\"  class=\"content\">
		   <g id=\"svgMaster\">
		 <image xlink:href=\"$imagefile.jpg\" draggable=\"true\" x=\"0\" y=\"0\" height=\"$height\" width=\"$width\" id=\"image\" title=\"".$_SESSION['cuneidemo']['imageID']."\">
		 </svg>" ;
}

function insertThumb()
{
	global $xmlImages;
	$imagefile = $_SESSION['cuneidemo']['imagesPath'].($xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file);
	$imagesize =  getimagesize($imagefile.".jpg");
	$width = $imagesize[0];
	$height = $imagesize[1];
	echo "<image xlink:href=\"$imagefile.jpg\" draggable=\"true\" x=\"0\" y=\"0\" height=\"$height\" width=\"$width\" id=\"thumb\" title=\"".$_SESSION['cuneidemo']['imageID']."\">
	</svg>" ;
}
function insertJavascript()
{
	echo "<script> var autoload = $GLOBALS[annotation];
					var statusAnnotations = \"$GLOBALS[statusAnnotations]\";
					var annotationsVersions = $GLOBALS[versions];
					var urlThumbHOG = \""._RESULTS_.$_SESSION['cuneidemo']["user"]."HOG.jpg\";
					var urlThumb = \""._RESULTS_.$_SESSION['cuneidemo']["user"]."thumbs.jpg\"; </script>";
}
?>



