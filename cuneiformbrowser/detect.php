 <?php 
if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if($_SESSION['cuneidemo']["enabled"] != true)
{
	exit;
}
include_once('config.php');
include_once('logger.php');

logMessage("Detection on image started");

// First, check if the user already started a detection

if(file_exists(_RESULTS_."/serverLOG_".$_SESSION['cuneidemo']['user'].".txt"))
{
	$response = json_encode(array('error' => 'running'));
	echo $response;
	exit();
}

// find the image
$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
$imageID = intval($_SESSION['cuneidemo']['imageID']);
$name = $xmlImages->image[$imageID]->file;
$imageName = $name.'.jpg';

// ... and paths
$pathBase = getcwd().DIRECTORY_SEPARATOR;
$pathIm = $pathBase.$_SESSION['cuneidemo']['imagesPath'].$imageName;
$folderDet = $_POST['model_version']."_web_detections_ssd".DIRECTORY_SEPARATOR;
$folderColl = $_SESSION['cuneidemo']['collectionFolderName'];
$fileDet = $name.'_all_boxes.csv';
$pathDet = $pathBase.$_SESSION['cuneidemo']['performance']."fullResults".DIRECTORY_SEPARATOR.$folderDet.$folderColl.$fileDet;

// maybe jsonencode not needed!!!!
//$_POST = json_decode(file_get_contents("php://input"),true);


$DEBUG_SET = false;

$RETURN_SET = false;

// debug - print info
if ($DEBUG_SET) 
{
	echo $_SESSION['cuneidemo']['user'];    	// user
	echo "<br>";
	echo $imageName;           		// image name
	echo "<br>";
	echo $_SESSION['cuneidemo']['imagesPath']; 					// image folder
	echo "<br>";
	echo $_SESSION['cuneidemo']['performance']."fullResults".DIRECTORY_SEPARATOR; 	// results folder
	echo "<br>";
	echo $pathIm;
	echo "<br>";
	echo $pathDet;
	echo "<br>";
	echo $_POST['tab_scale']; 	// selected scale for tablet
	echo "<br>";
	echo $_POST['model_version']; 	// selected sign detector
	echo "<br>";
	//echo print_r($_SESSION['cuneidemo']);
}


// set detector url
$detector_url = 'http://localhost:5000/detector_php';
if(isset($_POST['model_version']))
{
    if($_POST['model_version'] == 'vA')
    {   // point to old babylonian detector
        $detector_url = 'http://localhost:5001/detector_php_OB';

    }
}


// check if arguments are set
if(isset($_POST['tab_scale']))
{

	logMessage("image: ".$imageName);


	// call Flask via http request 
	// http://docs.php.net/manual/da/httprequest.send.php
	// $r = new HttpRequest('http://example.com/feed.rss', HttpRequest::METH_GET);

	// call Flask via cURL
	// https://www.php.net/manual/en/function.curl-setopt-array.php
	// create a new cURL resource
	$ch = curl_init();

	// set URL and other appropriate options
	$params= array('tab_scale'=>$_POST['tab_scale'], 'model_version'=>$_POST['model_version'], 'det_path'=>$pathDet, 'im_path'=>$pathIm);
	$options = array(CURLOPT_URL => $detector_url,
			 CURLOPT_POST => true,
			 CURLOPT_RETURNTRANSFER => $RETURN_SET, // Set TRUE to return the transfer as a string of the return value of curl_exec() instead of outputting it out directly.
			 CURLOPT_POSTFIELDS => $params);  // not multipart form: http_build_query($params)
	curl_setopt_array($ch, $options);

	// grab URL and pass it to the browser
	$response_flask = curl_exec($ch);

	// close cURL resource, and free up system resources
	curl_close($ch); 

	if ($RETURN_SET) 
	{
		// debug - print flask output // only required if CURLOPT_RETURNTRANSFER => true
		if ($DEBUG_SET) 
		{
			echo $response_flask;
		}

		$response = json_encode(array('detection' => 'true', 'error' => 'none'));
		echo $response;
	}

}
else 
{

	$response = json_encode(array('detection' => 'false', 'error' => 'missing arguments'));
	echo $response;

}

 ?>
