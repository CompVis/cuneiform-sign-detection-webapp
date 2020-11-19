 <?php if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	exit;
 }
 include_once('config.php');
 include_once('logger.php');

 if(isset($_POST['corrections']))
 {
	 logMessage("Saving corrections for later use");

	 // ALL BB will be saved

	 //var_dump($_POST);

	 $backupCorrections = fopen(_USERS_.$_SESSION['cuneidemo']['user'].'_backupDetection.txt','w');

	 fprintf($backupCorrections, '{"imageID":%d,"group":%d,"collection":%d}'.PHP_EOL, $_SESSION['cuneidemo']["imageID"],$_SESSION['cuneidemo']["group"],$_SESSION['cuneidemo']["collection"]);
	 fwrite($backupCorrections, json_encode(Array("corrections"=>$_POST['corrections'],"detectionID"=>$_POST['detectionID'])));

	 fclose($backupCorrections);

	 echo "done";
 }
 else
 {
 	logMessage("Retrieving backed up corrections");
 	$backupCorrections = fopen(_USERS_.$_SESSION['cuneidemo']['user'].'_backupDetection.txt','rb');

 	// Read all the contents
 	fgets($backupCorrections); // first line is only for the server
 	$content ='';

 	while(($line = fgets($backupCorrections))!== false)
 	{
 		$content .= $line; // append the whole infos.
 	}

 	fclose($backupCorrections);
 	echo $content;
 }
 ?>
