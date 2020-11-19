<?php
session_start();
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	echo "nope!";
 	exit;
 }
include_once('config.php'); // Needed for the different Folders
include_once('logger.php');
$thumb = true;

if(isset($_POST['id']))
{
	$dictionaryJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."dictionary.json");
	$dictionary = json_decode($dictionaryJSON,true);

		//foreach($_POST['data'] as $newEntry) // Newentry = {id: X, label = Y}
		//{
		if(is_array($_POST['label']))
		{
			$dictionary[$_POST['id']] = $_POST['label'];
			$thumb = false;
		}else
			$dictionary[$_POST['id']][] = $_POST['label'];
		//}

	$dictionaryJSON = json_encode($dictionary);

	file_put_contents($_SESSION['cuneidemo']['groupFolder']."dictionary.json",$dictionaryJSON);

	// Now, generate a new thumb, if needed
	if(!file_exists($_SESSION['cuneidemo']['groupModels']."modelThumb/thumb_".sprintf("%03d", $_POST['id'])."_model001.jpg") && $thumb)
	{
		$xmlImages = simplexml_load_file($_SESSION['nagbu']['collectionFolder'].'imagesList.xml');
		$imagefile = $_SESSION['cuneidemo']['imagesPath'].((String)$xmlImages->image[$_SESSION['cuneidemo']["imageID"]]->file).".jpg";
		$src = imagecreatefromjpeg($imagefile);

		if($_POST['height']>$_POST['width'])
		{
			$height = 100<$_POST['height']? 100:$_POST['height'];
			$width = $_POST['width']*$height/$_POST['height'];
		}
		else
		{
			$width = 100<$_POST['width']? 100:$_POST['width'];
			$height = $_POST['height']*$width/$_POST['width'];
		}

		$dest = imagecreatetruecolor($width, $height);

		imagecopyresized($dest, $src, 0, 0,$_POST['x'], $_POST['y'],$width, $height, $_POST['width'], $_POST['height']);

		imagejpeg($dest,$_SESSION['cuneidemo']['groupModels']."modelThumb/thumbBack_".sprintf("%03d", $_POST['id']).".jpg");

	}
}
else
{
	echo json_encode(array('error'=>true));
}
?>
