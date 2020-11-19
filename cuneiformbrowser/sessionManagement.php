<?php

if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
	include_once('config.php');
	include_once('logger.php');
	$message ="";
    $askedFlag = false;


	if(!isset($_SESSION["cuneidemo"]))
	{
	    if(!isset($_POST["user"]))
	    {
	        form();
	    }

	    $user = $_POST["user"];
	    $pass = $_POST["pass"];
	    $xmlUsers = simplexml_load_file(_USERSLIST_);

	    foreach($xmlUsers->user as $userInfo)
	    {
	        $userName = $userInfo->name;
	        if($userName == $user)
	        {
	            $userPassword = $userInfo->password;
	            $askedflag = true;
	            break;
	        }
	    }

		if(($user == $userName && $pass == $userPassword))
		{
			$_SESSION["cuneidemo"] = Array();
		    $_SESSION["cuneidemo"]["enabled"] = true;
		    $_SESSION["cuneidemo"]["user"] = $user;

		    startSessionLog();

		}
		else
		{
			# Show login form. Request for username and password
			$message = "Wrong username and/or password";
            form();
		}
	}



function form()
{
    global $message;
			{?>
				<html>
				<body>
					<form method="POST" action="">
						Username: <input type="text" name="user"><br/>
						Password: <input type="password" name="pass"><br/>
						<input type="submit" name="submit" value="Login">
					</form> <br />
					<?php echo $message;?>
					<br />
					Please note: this Web Interface will only work with modern browsers (IE10+ Firefox23+ Chrome7+ Opera12.01+) </br>
					For an optimal experience, Firefox or Chrome are recommended

				</body>
				</html>
			<?php }
			exit;
}

function startingCheck()
{
 	if(file_exists(_USERS_.$_SESSION["cuneidemo"]['user'].'process.txt'))
 	{
 		$file = fopen(_USERDATA_.$_SESSION["nagbu"]['user']."process.txt",'rb');
 		$process = trim(fgets($file));  // first line -> type of process
 		$_SESSION['verboseFile'] = trim(fgets($file)); // verbose file
 		$jsonData = json_decode(trim(fgets($file)),true); // info
 //		$_SESSION['backupData'] = $jsonData;
 		fclose($file);
 		return array('process'=>true,'type'=>$process);
 	}
	if(file_exists(_USERS_.$_SESSION["cuneidemo"]['user'].'_backupDetection.txt'))
	{
		logMessage("Corrections available.");
		$backupCorrections = fopen(_USERS_.$_SESSION["cuneidemo"]['user'].'_backupDetection.txt','rb');

		$image = fscanf($backupCorrections, "%u"); // first line is only for the server
		fclose($backupCorrections);
		return array('process'=>false,'backup'=>true, 'image'=>$image);
	}
	else
		return array('process'=>false,'backup'=>false);
}
?>


