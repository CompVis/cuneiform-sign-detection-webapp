 <?php if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
 	exit;
 }
 include_once('config.php');
 include_once('logger.php');


 	$logJSON = file_get_contents('php://input');

 //	if(isJSON($logJSON))
 //	{
 		$time = @date('d/m/Y - G:i:s ');
 		$logfile = _LOGPATH_."changeLog_".$_SESSION['cuneidemo']["imageName"].".log";
 		//$logfile = _LOGPATH_."testlog.log";
 		logMessage("Saving changes' log in $logfile");
 		$log = fopen($logfile, 'a');
 		fwrite($log,"####### Update ######\n### user: ".$_SESSION['cuneidemo']["user"]."\n### $time\n");
 		fwrite($log, $logJSON . PHP_EOL);
 		fclose($log);
 //	}


 function isJSON($string){
 	return is_string($string) && is_object(json_decode($string)) ? true : false;
 }

 ?>