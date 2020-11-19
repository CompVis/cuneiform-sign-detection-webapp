 <?php session_start();
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	exit;
 }
 include_once('config.php');
 include_once('logger.php');
 // Two AJAX calls are needed here
 // first one sends the status of the annotation
 // second one the data.

 /*if(isset($_GET["annotationStatus"]))
 {
 	logMessage("Preparing annotation's saving. Mode = ".$_GET["annotationStatus"]);
 	$_SESSION['cuneidemo']["annotationStatus"] = $_GET["annotationStatus"];  // WTF?
 	echo json_encode(array('done' => true)	);
 	exit;
 }
 else
 {*/

 $_SESSION['cuneidemo']["annotationStatus"] = $_POST["saveMode"];

 	$imageID = $_SESSION['cuneidemo']["imageID"];
 	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);

	// No Annotation file
 	$fileName = $xmlImages->image[$imageID]->annotation;

 	if($fileName=="empty")
 	{
 		$fileName = (string)$xmlImages->image[$imageID]->file;
 		$xmlImages->image[$imageID]->annotation = $fileName;
 		$version = 0;
 	}
 	else
 	{
 		$fileName = (string)$xmlImages->image[$imageID]->annotation;
 		if(isset($xmlImages->image[$imageID]->annotation["version"]))
 			$version = (string)$xmlImages->image[$imageID]->annotation["version"];
 		else
 			$version = 0;
 	}
	// $imageID = $_SESSION['cuneidemo']["ImageID"];

 	// check if file already archivates (jkust in case)
 	if((string)$xmlImages->image[$imageID]->annotation["info"] == "done")
 	 	exit;

	 //$annotation = simplexml_load_file('php://input');
	 if(!empty($_POST["xml"]))
	 {
	 	 $annotation = simplexml_load_string($_POST["xml"]);
		 $annotation->filename = (string)$xmlImages->image[$imageID]->name;
		 $annotation->folder = "KileS";
		 $_SESSION['cuneidemo']["imageName"] = (string)$annotation->filename;

		 if ($_SESSION['cuneidemo']["annotationStatus"] == "archive")
		 {
		    if(file_exists($_SESSION['cuneidemo']['annotationsPath']. $fileName.".xml"))
		 	    rename($_SESSION['cuneidemo']['annotationsPath'] . $fileName.".xml", $_SESSION['cuneidemo']['annotationsPath'].'backup'.DIRECTORY_SEPARATOR. $fileName.".xml"); //backup
		    // Now get rid of the old versions ... or jsut move them? Just move them first...
	 	    foreach (glob($_SESSION['cuneidemo']['annotationsPath'] .$fileName."*.xml") as $annoFile) {
	 	    	rename($annoFile, $_SESSION['cuneidemo']['annotationsPath'].'backup'.DIRECTORY_SEPARATOR . basename($annoFile)); //backup
	 	    }

		 	$xmlImages->image[$imageID]->annotation["info"] = "done";
		 	// change the name of the annotation

		 	$xmlImages->image[$imageID]->annotation = 'im_'.$fileName;

		 	// save a copy of the annotations for training
		 	// First, rename some boxes!
		 	//$annotationFilter = labelFiltering($annotation);
		 	$annotationFilter->asXML($_SESSION['cuneidemo']['collectionFolder']."archivedAnnotations" . DIRECTORY_SEPARATOR. 'im_'.$fileName.".xml");

		 	//Save information in the master archive for the collection.
		 	$archiveJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."archivedAnnotations.json");
		 	$archive = json_decode($archiveJSON,true);

		 	$archive['images'][$_SESSION['cuneidemo']['collection']][]=$fileName;

		 	$archiveJSON = json_encode($archive);
		 	$fileName = 'im_'.$fileName;
		 	file_put_contents($_SESSION['cuneidemo']['groupFolder']."archivedAnnotations.json",$archiveJSON);
		 }
		 else
		 {
		 	 $version = $version+1;
		 	 copy($_SESSION['cuneidemo']['annotationsPath'] . $fileName.".xml", $_SESSION['cuneidemo']['annotationsPath']. ($xmlImages->image[$imageID]->file) . "-v".$version.".xml"); //backup
		     $xmlImages->image[$imageID]->annotation["version"] = $version;

		 }

		 // Rename the annotation for the web-Interface and save.
		 $annotation->asXML($_SESSION['cuneidemo']['annotationsPath'] . $fileName.".xml");

		 logMessage("$fileName: new annotations' version ($version) saved");
	 }

	 if(!empty($_POST["lines"]))
	 {
	 	file_put_contents($_SESSION['cuneidemo']['collectionFolder']."archivedAnnotations" . DIRECTORY_SEPARATOR.$fileName."_lines.csv",$_POST["lines"] );
	 }

	 if ($_SESSION['cuneidemo']["annotationStatus"] == "archive")
	 {
	 	generateExamples($annotation, $_SESSION['cuneidemo']["imageName"]);
	 	logMessage("$fileName: new examples' images saved");
	 }

	 if(!(empty($_POST["xml"]) && empty($_POST["lines"])))
	 {
	 	$xmlImages->image[$imageID]->annotation["info"] = "partial";
	 	$xmlImages->asXML($_SESSION['cuneidemo']['imagesList']);
	 }
 //}

 // TODO: Validate XML!!!!!!

 // Things to check:
 // New Annotations File?
 // New Version?
 // Definitive Version?
function labelFiltering($xml)
 {
 		// Rules is a json file: "label":"toreplace"
 		$replacements = json_decode(file_get_contents($_SESSION['cuneidemo']["groupFolder"]."replacementRules.json"),true);

 		foreach($xml->xpath( '//object') as $object)
 		{
 			$sign = (String)$object->symbol;
 			if(isset($replacements[$sign]))
 			{
 				$object->symbol = $replacements[$sign];
 			}
 		}

 		return $xml;
 }





	 function generateExamples($annotations, $imageFile)
	 {
	 	/* This should:
	 	 * check if an annotation already has a model (escape)
	 	 * if not, check for the last image
	 	 * start generating new images
	 	 * Use a file?
	 	 * Think about erasing after training?
	 	 */

	 	// Change of mind: keep _all_ the examples alive, no matter what. At least for now.
	 	// So, TODO:
	 	// index  "label": num of images (json file)
	 	// generate thumb, actualize array
	 	// save json file.
	 	// maybe have a file linked to both this and updatedictionary to generate the thumb?

	 	// Load index
	 	$signIndex = json_decode(file_get_contents($_SESSION['cuneidemo']['groupModels'].'examples'.DIRECTORY_SEPARATOR.'examplesList.json'),true);

	 	$imageIndex = Array();  // Keep track of the signs.

	 	$imageIndex['imageName'] = $imageFile.'.jpg';
	 	$imageIndex["imageID"] = $_SESSION['cuneidemo']["imageID"];
	 	$imageIndex['group'] = $_SESSION['cuneidemo']["group"];
	 	$imageIndex['collection'] = $_SESSION['cuneidemo']["collection"];
	 	$imageIndex['totalSigns'] = 0;

	 	$imageIndex['list'] = Array();


	 	$src = imagecreatefromjpeg($_SESSION['cuneidemo']['imagesPath'].$_SESSION['cuneidemo']["imageName"].'.jpg');  // create the image that will generate the thumbs

	 	foreach($annotations->object as $box)
	 	{
	 		// First, check annotation and look for it in the index
	 		$current = (String) $box->symbol;
	 		if(!isset($signIndex["index"][$current]))
	 		{	// This label has no entry!
	 			$signIndex["index"][$current] = 0;
	 		}

	 		// List for the image
	 		if(!isset($imageIndex['list'][$current]))
	 		{
	 			$imageIndex['list'][$current] = Array("start"=>$signIndex["index"][$current]+1, "end"=>$signIndex["index"][$current], "total"=>0);
	 		}
	 		$x =floor(floatval($box->bndbox->xmin));
	 		$y =floor(floatval($box->bndbox->ymin));
	 		$height = ceil(floatval($box->bndbox->ymax))- $y;
	 		$width = ceil(floatval($box->bndbox->xmax))- $x;

	 		if($height>$width)
	 		{
	 			$heightnew = 100<$height? 100:$height;
	 			$widthnew = $width*$heightnew/$height;
	 		}
	 		else
	 		{
	 			$widthnew = 100<$width? 100:$width;
	 			$heightnew = $height*$widthnew/$width;
	 		}

	 		$dest = imagecreatetruecolor($widthnew, $heightnew);

	 		imagecopyresized($dest, $src, 0, 0, $x, $y,$widthnew, $heightnew, $width, $height);

	 		//Update indexes!
	 		$signIndex["total"] += 1;
	 		$signIndex["index"][$current] += 1;

	 		$imageIndex['list'][$current]["end"] += 1;
	 		$imageIndex['list'][$current]["total"] += 1;
	 		$imageIndex['totalSigns'] += 1;

	 		imagejpeg($dest,$_SESSION['cuneidemo']['groupModels']."examples".DIRECTORY_SEPARATOR.sprintf("model%03d_%06d_%s", intval($current), $signIndex["index"][$current], $imageFile).".jpg");


	 	}

	 	// Done, sort and save the indexes
	 	ksort($signIndex['index']);
	 	ksort($imageIndex['list']);

	 	file_put_contents($_SESSION['cuneidemo']['groupModels'].'examples'.DIRECTORY_SEPARATOR.'examplesList.json', json_encode($signIndex));
	 	file_put_contents($_SESSION['cuneidemo']['groupModels'].'examples'.DIRECTORY_SEPARATOR.$imageFile.'_ID'.$_SESSION['cuneidemo']["imageID"].'.json', json_encode($imageIndex));

	 }


 ?>
