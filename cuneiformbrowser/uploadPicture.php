 <?php session_start();
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	exit;
 }
 include_once('config.php');
 include_once('logger.php');
 // 1 Check if image
 // 2 Check if exists
 // 3 Store
 // 4 add xml
 // 5 pass to editor
 // same for Annotations? Or use AJAX instead? Yep, Ajax

$newName = $_POST["catalog"];
//$side = $_POST["side"];
$uploadOk=1;
$aValid = array('-', '_'); // this will be sued to replace spetial characters allowed in tablets' names.
							// like this: !ctype_alnum(str_replace($aValid, '', $sUser)

// Check if file is image
$imageType = exif_imagetype($_FILES['imageUploaded']['tmp_name']);
logmessage("has uploaded a file. Temporal name: ".$_FILES['imageUploaded']['tmp_name']);


$allowedTypes = array( 
        1,  // [] gif 
        2,  // [] jpg 
        3,  // [] png 
        6   // [] bmp 
    ); 
if (!in_array($imageType, $allowedTypes)) { 
	logMessage("uploaded a not supported image file format.");
	 //	echo $_FILES['imageUploaded'];
	 //	echo "Not an Image";
	 //	echo $imageType." ".$_FILES['imageUploaded']['tmp_name']." - ";
	 $uploadOk = 0;
} else {
	switch ($imageType) { 
		case 1 : 
		    $img = imageCreateFromGif($_FILES['imageUploaded']['tmp_name']); 
		    $file_ext = ".gif";
		break; 
		case 2 : 
		    $img = imageCreateFromJpeg($_FILES['imageUploaded']['tmp_name']);
		    $file_ext = ".jpg";
		break; 
		case 3 : 
		    $img = imageCreateFromPng($_FILES['imageUploaded']['tmp_name']);
		    $file_ext = ".png";
		break; 
		case 6 : 
		    $img = imageCreateFromBmp($_FILES['imageUploaded']['tmp_name']);
		    $file_ext = ".bmp";
		break; 
	}    
}

// Check if Name is valid
if(!ctype_alnum(str_replace($aValid, '',$newName)))
{
    logMessage("uploaded an image with invalid name.");
	echo "incorrect name";
	$uploadOk = 0;
}
//$newFileName = $_SESSION['cuneidemo']['imagesPath'] .$newName  . $file_ext; // does not work, because editor expects jpg extensions :/
$newFileName = $_SESSION['cuneidemo']['imagesPath'] .$newName  . ".jpg";
$newThumb =  $_SESSION['cuneidemo']['collectionFolder'] .'thumbs'.DIRECTORY_SEPARATOR. $newName  . "-thumb" . ".jpg";


// Check if file already exists
if (file_exists($newFileName)) {
    logMessage("uploaded an image that already exists.");
    echo "Sorry, file already exists.";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk==0) {
    echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
    #if (move_uploaded_file($_FILES["imageUploaded"]["tmp_name"], $newFileName)) {
    if (imagejpeg($img, $newFileName, 90)) {
        logMessage("uploaded an Image: ". $newFileName);
    } else {
        logMessage("error storing the image file.");
        echo "Sorry, there was an error uploading your file.". $_FILES["imageUploaded"]["tmp_name"];
    }

 // File stored, now the rest
 // thumbnail

    $width = imagesx( $img );
    $height = imagesy( $img );

    // calculate thumbnail size

    $new_width = 200;
    $new_height = floor( $height * ( 200 / $width ) );
    if ($new_height>270)
    {
	$new_height = floor( $height * ( 270 / $height ) );
	$new_width = floor( $width * ( 270 / $height ) );
    }
    // create a new temporary image
    $tmp_img = imagecreatetruecolor( $new_width, $new_height );

    // copy and resize old image into new image
    imagecopyresized( $tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height );

    // save thumbnail into a file
    imagejpeg( $tmp_img,  $newThumb);

 // XML

    $xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);

    $image = $xmlImages->addChild("image");
    $items = $xmlImages->total + 1;

    $image->addChild("id", $items);
    $name = $image->addChild("name", $newName . $side);
    //if($side == "Vs")
   // 	$Fside = "front";
   // else
   // 	$Fside = "back";
   $Fside = "NA";
    $name->addAttribute("type", $Fside);
    $image->addChild("file", $newName . $side);
    $image->addChild("annotation","empty");
    $image->annotation->addAttribute("info", "none");
    $xmlImages->total = $items;
    //backup!
    copy($_SESSION['cuneidemo']['imagesList'], $_SESSION['cuneidemo']['collectionFolder'] . "backup.xml");
    $xmlImages->asXML($_SESSION['cuneidemo']['imagesList']);

	$items--;

 // call editor

 	header("Location: editor.php?image=$items&annotation=false");


}
?>
