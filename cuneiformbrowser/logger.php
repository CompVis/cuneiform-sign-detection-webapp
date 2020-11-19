<?php
include_once('config.php');

function logMessage($message)
{
            $user = $_SESSION['cuneidemo']['user'];
            $logfile = _LOGPATH_.$user.".log";
		    $log = fopen($logfile, 'a');
		    $time = @date('[d/M/Y:H:i:s]');
		    fwrite($log, "$time ($user) $message" . PHP_EOL);
		    fclose($log);
}

function startSessionLog()
{
            $user = $_SESSION['cuneidemo']['user'];

//		    $log = fopen(_LOGFILE_, 'a');
//		    $time = @date('[d/M/Y:H:i:s]');
//		    fwrite($log, "############ NEW SESSION ###############" . PHP_EOL);
//		    fwrite($log, "$time ($user) has logged in." . PHP_EOL);
//		    fclose($log);

		    logMessage("has logged in.");

}



?>
